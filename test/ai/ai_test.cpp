#include <gtest/gtest.h>
#include <ai.hpp>
#include <vector>
#include <exception>
#include <string>
#include <fstream>

const short labels[15] = {1, 10, 2, 20, 3, 30, 4, 40, 5, 50, 6, 7, 8, 9, 0};

using bitmap = std::vector<unsigned char>;

class AITest : public ::testing::Test {
protected:
    AITest() : ai(tf::AI::create("model.pb"), {labels, sizeof(labels)}) {}

    bitmap loadImage(const std::string &path) {
        std::ifstream file(path, std::ios::binary | std::ios::ate);
        std::streamsize size = file.tellg();
        file.seekg(0, std::ios::beg);

        bitmap buffer(size);
        if (file.read((char *) buffer.data(), size)) {
            return buffer;
        } else {
            throw std::exception("Could not read the file");
        }
    }

    ~AITest() override {
        tf::AI::destroy(ai);
    }

    tf::AI *ai;
};

TEST_F(AITest, EvensTest) {
    bitmap bmp = loadImage("img/1/1.jpg");
    short res = ai->predict((char *) bmp.data(), bmp.size());

    EXPECT_EQ(res, 1);
}

TEST_F(AITest, TwoTest) {
    bitmap bmp = loadImage("img/2/1.jpg");
    short res = ai->predict((char *) bmp.data(), bmp.size());

    EXPECT_EQ(res, 2);
}

int main(int argc, char **argv) {
    ::testing::InitGoogleTest(&argc, argv);
    return RUN_ALL_TESTS();
}