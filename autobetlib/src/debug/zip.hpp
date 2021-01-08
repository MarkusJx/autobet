#include <string>
#include <mutex>
#include <memory>
#include <vector>
#include <zip/zip.h>

namespace minizip {
    /**
     * A class for zipping data.
     * Based on: https://github.com/kuba--/zip
     */
    class zip {
    public:
        /**
         * Create a empty zip instance
         */
        inline zip(std::nullptr_t) : _zip(nullptr), mtx(nullptr) {}

        /**
         * Create a zip file
         *
         * @param filename the file name
         * @param compression the compression level
         * @param mode the mode. May be 'w', 'r' or 'a'.
         */
        inline explicit zip(const std::string &filename, int compression = 0, char mode = 'w') : mtx(
                std::make_shared<std::mutex>()) {
            struct zip_t *z = zip_open(filename.c_str(), compression, mode);
            if (z == nullptr) {
                throw std::exception("Could not create the zip file");
            } else {
                _zip = std::shared_ptr<struct zip_t>(z, zip_close);
            }
        }

        /**
         * Write a file to the zip file
         *
         * @param dest the destination path
         * @param source the source path
         */
        inline void write(const std::string &dest, const std::string &source) {
            if (!this->operator bool()) {
                throw std::exception("The zip file does not exist");
            }

            std::unique_lock <std::mutex> lock(*mtx.get());
            if (zip_entry_open(_zip.get(), dest.c_str()) != 0) {
                throw std::exception("Unable to open zip file to write");
            }

            if (zip_entry_fwrite(_zip.get(), source.c_str()) != 0) {
                zip_entry_close(_zip.get());
                throw std::exception("Unable to write zip file");
            }

            if (zip_entry_close(_zip.get()) != 0) {
                throw std::exception("Unable to close zip file");
            }
        }

        /**
         * Write data to the zip file
         *
         * @tparam T the data type
         * @param dest the destination file path
         * @param data the data to write
         */
        template<class T>
        inline void write(const std::string &dest, const std::vector <T> &data) {
            if (!this->operator bool()) {
                throw std::exception("The zip file does not exist");
            }

            std::unique_lock <std::mutex> lock(*mtx.get());
            if (zip_entry_open(_zip.get(), dest.c_str()) != 0) {
                throw std::exception("Unable to open zip file to write");
            }

            if (zip_entry_write(_zip.get(), data.data(), data.size()) != 0) {
                zip_entry_close(_zip.get());
                throw std::exception("Unable to write to zip file");
            }

            if (zip_entry_close(_zip.get()) != 0) {
                throw std::exception("Unable to close zip file");
            }
        }

        /**
         * Check if this file can be written to
         *
         * @return true, if the zip file is writable
         */
        inline operator bool() const noexcept {
            return _zip.operator bool() && mtx.operator bool();
        }

        /**
         * Close the file
         */
        inline void reset() {
            std::unique_lock <std::mutex> lock(*mtx.get());
            _zip.reset();
            lock.unlock();
            mtx.reset();
        }

        /**
         * Close the file and release all resources
         */
        ~zip() = default;

    private:
        std::shared_ptr<struct zip_t> _zip;
        std::shared_ptr <std::mutex> mtx;
    };
}