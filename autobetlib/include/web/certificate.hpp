#ifndef AUTOBETLIB_CERTIFICATE_HPP
#define AUTOBETLIB_CERTIFICATE_HPP

#include <stdexcept>
#include <array>

#ifndef NO_NAPI

#include <napi.h>

#endif //NO_NAPI

namespace autobet::web {
    /**
     * An opensslException
     */
    class opensslException : public std::runtime_error {
    public:
        /**
         * Create an opensslException
         */
        opensslException() noexcept;

        /**
         * Create an opensslException
         *
         * @param msg the error message
         */
        explicit opensslException(const char *msg) noexcept;

        /**
         * Get the error from openssl
         *
         * @return the openssl error as a string
         */
        [[nodiscard]] const char *getOpensslErr() const;

    private:
        const char *opensslErr;
    };

    class cert_info {
    public:
        cert_info(std::string c, std::string st, std::string l, std::string o, std::string ou, std::string e,
                  std::string cn, std::string uid);

#ifndef NO_NAPI

        static Napi::Value toNapiValue(const Napi::Env &env, const cert_info &c);

#endif //NO_NAPI

        // The country
        const std::string C;

        // The state or province name
        const std::string ST;

        // The locality
        const std::string L;

        // The organization
        const std::string O;

        // The organizational unit
        const std::string OU;

        // The email
        const std::string E;

        // The common name
        const std::string CN;

        // The User ID
        const std::string UID;
    };

    using sha256_hash_array = std::array<unsigned char, 32>;

    class certificate {
    public:
        certificate(const std::string &cert, const std::string &privateKey);

        const std::unique_ptr<cert_info> &get_issuer();

        const std::unique_ptr<cert_info> &get_subject();

        bool certificates_valid();

    private:
        std::unique_ptr<cert_info> issuer;
        std::unique_ptr<cert_info> subject;
        sha256_hash_array cert_hash;
        sha256_hash_array private_key_hash;
        std::string cert_path;
        std::string private_key_path;
    };
}

#endif //AUTOBETLIB_CERTIFICATE_HPP
