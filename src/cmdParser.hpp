//
// Created by markus on 11/03/2020.
//

#ifndef AUTOBET_CMDPARSER_HPP
#define AUTOBET_CMDPARSER_HPP

#include <string>
#include <vector>
#include <map>

#define addCommand(val, tooltip, ...) _addCommand(val, tooltip, #val, __VA_ARGS__)
#define addCommandCheckSet(val, args, tooltip, ...) _addCommandCheckSet(val, args, tooltip, #val, __VA_ARGS__)

class cmdParser;

struct cmdOption {
    bool *b = nullptr;
    std::string *s = nullptr;
    int *i = nullptr;
    unsigned int *ui = nullptr;
    float *f = nullptr;
    cmdParser *c = nullptr;

    bool set = false;

    char *tooltip = nullptr;
    char *name = nullptr;
    char *valDesc = nullptr;

    std::vector<std::string> *sVal = nullptr;
    std::vector<int> *iVal = nullptr;
    std::vector<float> *fVal = nullptr;
};

class cmdParser {
private:
    typedef std::string string;
public:
    explicit cmdParser(size_t numOptions);

    cmdParser(size_t numOption, size_t numGroups);

    void _addCommand(bool &val, const string &tooltip, string name);

    void _addCommand(string &val, const string &tooltip, string name, string valDesc = "");

    void _addCommand(int &val, const string &tooltip, string name, const string& valDesc = "");

    void _addCommand(unsigned int &val, const string &tooltip, string name, const string& valDesc = "");

    void _addCommand(float &val, const std::string &tooltip, std::string name, const string &valDesc = "");

    void _addCommand(std::vector<string> &args, const string &tooltip, string name, const string &valDesc = "");

    void _addCommand(std::vector<int> &args, const string &tooltip, string name, const string &valDesc = "");

    void _addCommand(std::vector<float> &args, const string &tooltip, string name, const string &valDesc = "");

    void _addCommandCheckSet(bool &val, std::vector<string> &args, const string &tooltip, string name,
                             const string &valDesc = "");

    void _addCommandCheckSet(bool &val, std::vector<int> &args, const string &tooltip, string name,
                             const string &valDesc = "");

    void _addCommandCheckSet(bool &val, std::vector<float> &args, const string &tooltip, string name,
                             const string &valDesc = "");

    void _addGroup();

    void parse(int argc, char *argv[], unsigned int start = 1);

    void addHeading(const string &heading);

    void setArgMarker(const string &newMarker);

    void addReplace(char toReplace, char replacement);

    void setHelpCommand(string cmd);

    ~cmdParser();

private:
    size_t nOpt, nGroup, oPos, gPos;
    cmdOption **options;
    char *argMarker;
    std::map<char, char> replaceMap;
    string help;

    void displayHelp();

    void replaceAll(string &name);
};

#endif //AUTOBET_CMDPARSER_HPP
