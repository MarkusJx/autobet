#include <gtest/gtest.h>
#include <ai.hpp>
#include <vector>
#include <exception>
#include <string>
#include <fstream>
#include <filesystem>
#include <iostream>

namespace fs = std::filesystem;

const short labels[15] = {1, 10, 2, 20, 3, 30, 4, 40, 5, 50, 6, 7, 8, 9, 0};

using bitmap = std::vector<unsigned char>;

class AITest : public ::testing::Test {
protected:
    AITest() : ai(tf::AI::create("data/model.pb", {labels, sizeof(labels)})) {}

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

TEST_F(AITest, ThreeTest) {
    bitmap bmp = loadImage("img/3/1.jpg");
    short res = ai->predict((char *) bmp.data(), bmp.size());

    EXPECT_EQ(res, 3);
}

TEST_F(AITest, FourTest) {
    bitmap bmp = loadImage("img/4/1.jpg");
    short res = ai->predict((char *) bmp.data(), bmp.size());

    EXPECT_EQ(res, 4);
}

TEST_F(AITest, FiveTest) {
    bitmap bmp = loadImage("img/5/1.jpg");
    short res = ai->predict((char *) bmp.data(), bmp.size());

    EXPECT_EQ(res, 5);
}

TEST_F(AITest, SixTest) {
    bitmap bmp = loadImage("img/6/1.jpg");
    short res = ai->predict((char *) bmp.data(), bmp.size());

    EXPECT_EQ(res, 6);
}

TEST_F(AITest, SevenTest) {
    bitmap bmp = loadImage("img/7/1.jpg");
    short res = ai->predict((char *) bmp.data(), bmp.size());

    EXPECT_EQ(res, 7);
}

TEST_F(AITest, EightTest) {
    bitmap bmp = loadImage("img/8/1.jpg");
    short res = ai->predict((char *) bmp.data(), bmp.size());

    EXPECT_EQ(res, 8);
}

TEST_F(AITest, NineTest) {
    bitmap bmp = loadImage("img/9/1.jpg");
    short res = ai->predict((char *) bmp.data(), bmp.size());

    EXPECT_EQ(res, 9);
}

TEST_F(AITest, TenTest) {
    for (const auto &entry : fs::directory_iterator("img/10")) {
        std::cout << "Predicting image: " << entry.path() << std::endl;
        bitmap bmp = loadImage(entry.path().string());
        short res = ai->predict((char *) bmp.data(), bmp.size());

        EXPECT_EQ(res, 10);
    }
}

TEST_F(AITest, ZeroTest) {
    bitmap bmp = loadImage("img/zero/1.jpg");
    short res = ai->predict((char *) bmp.data(), bmp.size());

    EXPECT_EQ(res, 0);
}

TEST_F(AITest, TwentyTest) {
    bitmap bmp = loadImage("img/20/1.jpg");
    short res = ai->predict((char *) bmp.data(), bmp.size());

    EXPECT_EQ(res, 20);
}

TEST_F(AITest, ThirtyTest) {
    bitmap bmp = loadImage("img/30/1.jpg");
    short res = ai->predict((char *) bmp.data(), bmp.size());

    EXPECT_EQ(res, 30);
}

TEST_F(AITest, FourtyTest) {
    bitmap bmp = loadImage("img/40/1.jpg");
    short res = ai->predict((char *) bmp.data(), bmp.size());

    EXPECT_EQ(res, 40);
}

TEST_F(AITest, FiftyTest) {
    bitmap bmp = loadImage("img/50/1.jpg");
    short res = ai->predict((char *) bmp.data(), bmp.size());

    EXPECT_EQ(res, 50);
}

int main(int argc, char **argv) {
    ::testing::InitGoogleTest(&argc, argv);
    return RUN_ALL_TESTS();
}