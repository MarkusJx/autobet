#include <memory>
#include <stdexcept>
#include <array>
#include <fstream>
#include <vector>

#include <openssl/pem.h>
#include <openssl/err.h>
#include <openssl/rand.h>

#include "web/certificate.hpp"
#include "logger.hpp"

using namespace autobet::web;

opensslException::opensslException() noexcept: std::runtime_error("unknown error"),
                                               opensslErr(ERR_error_string(ERR_get_error(), nullptr)) {}

opensslException::opensslException(const char *msg) noexcept: std::runtime_error(msg),
                                                              opensslErr(ERR_error_string(ERR_get_error(), nullptr)) {}

const char *opensslException::getOpensslErr() const {
    return opensslErr;
}

void closeFile(FILE *f) {
    fflush(f);
    fclose(f);
}

using FILE_ptr = std::unique_ptr<FILE, decltype(&closeFile)>;

/**
 * Open a file
 *
 * @param filename the file name to open
 * @param mode the file mode
 * @return a FILE_ptr, may contain nullptr if operation was unsuccessful
 */
FILE_ptr openFile(const std::string &filename, const std::string &mode) {
#if defined(WIN32) || (defined(__STDC_LIB_EXT1__) && __STDC_WANT_LIB_EXT1__ == 1)
    FILE *tmp;
    errno_t err = fopen_s(&tmp, filename.c_str(), mode.c_str());
    if (err) {
        throw std::runtime_error("Unable to open file");
    } else {
        return FILE_ptr(tmp, closeFile);
    }
#else
    FILE_ptr file(fopen(filename.c_str(), mode.c_str()), closeFile);
    if (!file) {
        throw std::runtime_error("Unable to open file");
    } else {
        return file;
    }
#endif
}

using X509_ptr = std::unique_ptr<X509, decltype(&X509_free)>;
using EPV_PKEY_ptr = std::unique_ptr<EVP_PKEY, decltype(&EVP_PKEY_free)>;

std::string get_cert_field(X509_NAME *name, const std::string &field) {
    const int nid = OBJ_txt2nid(field.c_str());
    int sz = X509_NAME_get_text_by_NID(name, nid, nullptr, 0) + 1;

    if (sz > 1) {
        char *ch = (char *) calloc(sz, sizeof(char));
        sz = X509_NAME_get_text_by_NID(name, nid, ch, sz);

        if (sz > 1) {
            return std::string(ch);
        }
    }

    return "";
}

std::unique_ptr<cert_info> get_cert_info(const X509_ptr &x509, bool issuer) {
    X509_NAME *name;
    if (issuer) {
        name = X509_get_issuer_name(x509.get());
    } else {
        name = X509_get_subject_name(x509.get());
    }

    if (!name) {
        throw opensslException("Could not get the subject name");
    }

    std::string c = get_cert_field(name, "C");
    std::string st = get_cert_field(name, "ST");
    std::string l = get_cert_field(name, "L");
    std::string o = get_cert_field(name, "O");
    std::string ou = get_cert_field(name, "OU");
    std::string e = get_cert_field(name, "emailAddress");
    std::string cn = get_cert_field(name, "CN");
    std::string uid = get_cert_field(name, "UID");

    return std::make_unique<cert_info>(c, st, l, o, ou, e, cn, uid);
}

using byte = unsigned char;

sha256_hash_array hash_file(const std::string &filename) {
    SHA256_CTX context;
    if (!SHA256_Init(&context)) {
        throw opensslException("Could not initialize the sha context");
    }

    std::fstream stream(filename, std::ios::in | std::ios::binary);
    if (!stream) {
        throw std::runtime_error("Could not open the file stream for reading");
    }

    std::vector<byte> buf(16384, 0);
    do {
        stream.read((char *) buf.data(), static_cast<std::streamsize>(buf.size()));
        if (!SHA256_Update(&context, buf.data(), stream.gcount())) {
            throw opensslException("Could not update the hash");
        }
    } while (stream);
    stream.close();

    sha256_hash_array res;
    if (!SHA256_Final(res.data(), &context)) {
        throw opensslException("Could not finalize the hash");
    }

    return res;
}

cert_info::cert_info(std::string c, std::string st, std::string l, std::string o, std::string ou,
                     std::string e, std::string cn, std::string uid) : C(std::move(c)), ST(std::move(st)),
                                                                       L(std::move(l)), O(std::move(o)),
                                                                       OU(std::move(ou)), E(std::move(e)),
                                                                       CN(std::move(cn)),
                                                                       UID(std::move(uid)) {}

Napi::Value cert_info::toNapiValue(const Napi::Env &env, const cert_info &c) {
    Napi::Object res = Napi::Object::New(env);
    res.Set("country", c.C);
    res.Set("state", c.ST);
    res.Set("locality", c.L);
    res.Set("organization", c.O);
    res.Set("organizational_unit", c.OU);
    res.Set("email", c.E);
    res.Set("common_name", c.CN);
    res.Set("user_id", c.UID);

    return res;
}

certificate::certificate(const std::string &cert, const std::string &privateKey) {
    // Enable all OpenSSL security algorithms
    OpenSSL_add_all_algorithms();

    // Open the X509 cert file
    FILE_ptr x509_file = openFile(cert, "rb");

    // Read the PEM X509 file
    X509_ptr x509(PEM_read_X509(x509_file.get(), nullptr, nullptr, nullptr), X509_free);
    if (!x509) {
        throw opensslException("Could not read cert file");
    }

    // If a path to a private key is given, use it
    // Open the file
    FILE_ptr pkey_file = openFile(privateKey, "rb");

    // If the key for the encryption is not empty, just read it from the file
    EPV_PKEY_ptr pkey(PEM_read_PrivateKey(pkey_file.get(), nullptr, nullptr, nullptr), EVP_PKEY_free);
    if (!pkey) {
        throw opensslException("Could not read private key");
    }

    // Get the rsa object from PKEY
    RSA *rsa = EVP_PKEY_get1_RSA(pkey.get());
    if (!RSA_check_key(rsa)) {
        throw opensslException("RSA key is invalid");
    }

    // Get the rsa key length
    //int keyLen = RSA_size(rsa) * 8;
    issuer = get_cert_info(x509, true);
    subject = get_cert_info(x509, false);
    cert_hash = hash_file(cert);
    private_key_hash = hash_file(privateKey);
    cert_path = cert;
    private_key_path = privateKey;
}

const std::unique_ptr<cert_info> &certificate::get_issuer() {
    return issuer;
}

const std::unique_ptr<cert_info> &certificate::get_subject() {
    return subject;
}

bool certificate::certificates_valid() {
    try {
        return cert_hash == hash_file(cert_path) && private_key_hash == hash_file(private_key_path);
    } catch (const std::exception &e) {
        logger::StaticLogger::errorStream() << "Could not hash the certificates: " << e.what();
        return false;
    }
}
