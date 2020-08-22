#include <algorithm>
#include <iostream>
#include <utility>

#include "cmdParser.hpp"
#include "main.hpp"

#define acceptsMultiple(opt) (opt.sVal || opt.iVal || opt.fVal)
#define acceptsSingle(opt) (opt.b || opt.i || opt.s || opt.f || opt.ui)
#define optXY options[x][y]
#define CMP_ARGV(str) strcmp(argv[i], str) == 0
#define addArgMarker(str) for (short _i = (short) strlen(argMarker) - 1; _i >= 0 ; _i--) str.insert(0, 1, argMarker[_i])
#define checkPosValid() if (oPos >= nOpt || gPos >= nGroup) throw std::exception("More arguments added than in constructor declared")

#if defined(WIN32) || defined(_WIN32) || defined(__WIN32) && !defined(__CYGWIN__)
#   define strdup _strdup
#endif

typedef cmdOption *cmdOptPtr;

cmdParser::cmdParser(size_t numOptions) {
    oPos = 0;
    gPos = 0;
    nOpt = numOptions;
    nGroup = 1;
    options = new cmdOption *[1];
    for (int i = 0; i < 1; ++i) {
        options[i] = new cmdOption[numOptions];
    }
    argMarker = strdup("--");
    help = "--help";
    indent = 27;
}

cmdParser::cmdParser(size_t numOptions, size_t numGroups) {
    oPos = 0;
    gPos = 0;
    nOpt = numOptions;
    nGroup = numGroups;
    options = new cmdOption *[numGroups];
    for (int i = 0; i < numGroups; ++i)
        options[i] = new cmdOption[numOptions];
    argMarker = strdup("--");
    help = "--help";
    indent = 27;
}

cmdOptPtr cmdParser::_addCommand(bool &val, const string &tooltip, string name) {
    checkPosValid();
    val = false;
    options[gPos][oPos].b = &val;
    options[gPos][oPos].tooltip = strdup(tooltip.c_str());

    replaceAll(name);
    addArgMarker(name);

    options[gPos][oPos].name = strdup(name.c_str());
    oPos++;

    return &options[gPos][oPos];
}

cmdOptPtr cmdParser::_addCommand(string &val, const string &tooltip, string name, const string& valDesc) {
    checkPosValid();
    val = "";
    options[gPos][oPos].s = &val;
    options[gPos][oPos].tooltip = strdup(tooltip.c_str());

    replaceAll(name);
    addArgMarker(name);

    options[gPos][oPos].name = strdup(name.c_str());
    oPos++;

    return &options[gPos][oPos];
}

cmdOptPtr cmdParser::_addCommand(int &val, const string &tooltip, string name, const string &valDesc) {
    checkPosValid();
    options[gPos][oPos].i = &val;
    options[gPos][oPos].tooltip = strdup(tooltip.c_str());

    if (!valDesc.empty())
        options[gPos][oPos].valDesc = strdup(valDesc.c_str());

    replaceAll(name);
    addArgMarker(name);

    options[gPos][oPos].name = strdup(name.c_str());
    oPos++;

    return &options[gPos][oPos];
}

cmdOptPtr cmdParser::_addCommand(unsigned int &val, const string &tooltip, string name, const string &valDesc) {
    checkPosValid();
    options[gPos][oPos].ui = &val;
    options[gPos][oPos].tooltip = strdup(tooltip.c_str());

    if (!valDesc.empty())
        options[gPos][oPos].valDesc = strdup(valDesc.c_str());

    replaceAll(name);
    addArgMarker(name);

    options[gPos][oPos].name = strdup(name.c_str());
    oPos++;

    return &options[gPos][oPos];
}

cmdOptPtr cmdParser::_addCommand(float &val, const string &tooltip, string name, const string &valDesc) {
    checkPosValid();
    options[gPos][oPos].f = &val;
    options[gPos][oPos].tooltip = strdup(tooltip.c_str());

    if (!valDesc.empty())
        options[gPos][oPos].valDesc = strdup(valDesc.c_str());

    replaceAll(name);
    addArgMarker(name);

    options[gPos][oPos].name = strdup(name.c_str());
    oPos++;

    return &options[gPos][oPos];
}

cmdOptPtr cmdParser::_addCommand(std::vector<string> &args, const string &tooltip, string name, const string &valDesc) {
    checkPosValid();
    options[gPos][oPos].sVal = &args;
    options[gPos][oPos].tooltip = strdup(tooltip.c_str());

    if (!valDesc.empty())
        options[gPos][oPos].valDesc = strdup(valDesc.c_str());

    replaceAll(name);
    addArgMarker(name);

    options[gPos][oPos].name = strdup(name.c_str());
    oPos++;

    return &options[gPos][oPos];
}

cmdOptPtr cmdParser::_addCommand(std::vector<int> &args, const string &tooltip, string name, const string &valDesc) {
    checkPosValid();
    options[gPos][oPos].iVal = &args;
    options[gPos][oPos].tooltip = strdup(tooltip.c_str());

    if (!valDesc.empty())
        options[gPos][oPos].valDesc = strdup(valDesc.c_str());

    replaceAll(name);
    addArgMarker(name);

    options[gPos][oPos].name = strdup(name.c_str());
    oPos++;

    return &options[gPos][oPos];
}

cmdOptPtr cmdParser::_addCommand(std::vector<float> &args, const string &tooltip, string name, const string &valDesc) {
    checkPosValid();
    options[gPos][oPos].fVal = &args;
    options[gPos][oPos].tooltip = strdup(tooltip.c_str());

    if (!valDesc.empty())
        options[gPos][oPos].valDesc = strdup(valDesc.c_str());

    replaceAll(name);
    addArgMarker(name);

    options[gPos][oPos].name = strdup(name.c_str());
    oPos++;

    return &options[gPos][oPos];
}

cmdOptPtr cmdParser::_addCommandCheckSet(bool &val, std::vector<string> &args, const string &tooltip, string name,
                                    const string &valDesc) {
    checkPosValid();
    val = false;
    options[gPos][oPos].b = &val;
    options[gPos][oPos].sVal = &args;
    options[gPos][oPos].tooltip = strdup(tooltip.c_str());

    if (!valDesc.empty())
        options[gPos][oPos].valDesc = strdup(valDesc.c_str());

    replaceAll(name);
    addArgMarker(name);

    options[gPos][oPos].name = strdup(name.c_str());
    oPos++;

    return &options[gPos][oPos];
}

cmdOptPtr cmdParser::_addCommandCheckSet(bool &val, std::vector<int> &args, const string &tooltip, string name,
                                    const string &valDesc) {
    checkPosValid();
    val = false;
    options[gPos][oPos].b = &val;
    options[gPos][oPos].iVal = &args;
    options[gPos][oPos].tooltip = strdup(tooltip.c_str());

    if (!valDesc.empty())
        options[gPos][oPos].valDesc = strdup(valDesc.c_str());

    replaceAll(name);
    addArgMarker(name);

    options[gPos][oPos].name = strdup(name.c_str());
    oPos++;

    return &options[gPos][oPos];
}

cmdOptPtr cmdParser::_addCommandCheckSet(bool &val, std::vector<float> &args, const string &tooltip, string name,
                                    const string &valDesc) {
    checkPosValid();
    val = false;
    options[gPos][oPos].b = &val;
    options[gPos][oPos].fVal = &args;
    options[gPos][oPos].tooltip = strdup(tooltip.c_str());

    if (!valDesc.empty())
        options[gPos][oPos].valDesc = strdup(valDesc.c_str());

    replaceAll(name);
    addArgMarker(name);

    options[gPos][oPos].name = strdup(name.c_str());
    oPos++;

    return &options[gPos][oPos];
}

void cmdParser::_addGroup() {
    if (gPos + 1 < nGroup)
        gPos++;
}

void cmdParser::parse(int argc, char **argv, unsigned int start) {
    for (int i = (int) start; i < argc; i++) {
        if (CMP_ARGV(help.c_str())) {
            displayHelp();
            return;
        }
    }

    gPos = 0;
    for (int i = (int) start; i < argc; i++) {
        bool found = false;
        for (int x = gPos; x < nGroup; x++) {
            for (int y = 0; y < nOpt; y++) {
                if (options[x][y].name != nullptr) {
                    if (strcmp(options[x][y].name, argv[i]) == 0) {
                        found = true;
                        gPos = x;
                        optXY.required = false;
                        //x = nGroup;
                        if (!options[x][y].set || acceptsMultiple(options[x][y])) {
                            if (acceptsMultiple(options[x][y])) {
                                if (options[x][y].sVal) {
                                    if (options[x][y].b)
                                        *options[x][y].b = true;

                                    for (int z = i + 1; z < argc; z++) {
                                        if (!std::string(argv[z]).starts_with(argMarker)) {
                                            options[x][y].sVal->push_back(argv[z]);
                                            i++;
                                        } else {
                                            if (z > i)
                                                i = z - 1;
                                            break;
                                        }
                                    }
                                } else if (options[x][y].iVal) {
                                    if (options[x][y].b)
                                        *options[x][y].b = true;

                                    for (int z = i + 1; z < argc; z++) {
                                        if (!std::string(argv[z]).starts_with(argMarker)) {
                                            options[x][y].iVal->push_back(strtol(argv[z], nullptr, 10));
                                            i++;
                                        } else {
                                            if (z > i)
                                                i = z - 1;
                                            break;
                                        }
                                    }
                                } else {
                                    if (options[x][y].b)
                                        *options[x][y].b = true;

                                    for (int z = i + 1; z < argc; z++) {
                                        if (!std::string(argv[z]).starts_with(argMarker)) {
                                            options[x][y].fVal->push_back(strtof(argv[z], nullptr));
                                            i++;
                                        } else {
                                            if (z > i)
                                                i = z - 1;
                                            break;
                                        }
                                    }
                                }
                            } else {
                                options[x][y].set = true;
                                if (options[x][y].s) { // Requires string
                                    if (i + 1 < argc && !std::string(argv[i + 1]).starts_with(argMarker))
                                        *options[x][y].s = argv[++i];
                                    else {
                                        std::cerr << optXY.name << " requires one argument";
                                        exit(1);
                                    }
                                } else if (options[x][y].i) { // Requires int
                                    if (i + 1 < argc && !std::string(argv[i + 1]).starts_with(argMarker))
                                        *options[x][y].i = strtol(argv[++i], nullptr, 10);
                                    else {
                                        std::cerr << optXY.name << " requires one argument";
                                        exit(1);
                                    }
                                } else if (optXY.ui) { // Requires unsigned int
                                    if (i + 1 < argc && !std::string(argv[i + 1]).starts_with(argMarker))
                                        *options[x][y].ui = strtoul(argv[++i], nullptr, 10);
                                    else {
                                        std::cerr << optXY.name << " requires one argument";
                                        exit(1);
                                    }
                                } else if (options[x][y].b) { // Requires bool
                                    *options[x][y].b = true;
                                } else if (options[x][y].f) { // Requires float
                                    if (i + 1 < argc && !std::string(argv[i + 1]).starts_with(argMarker))
                                        *options[x][y].f = strtof(argv[++i], nullptr);
                                    else {
                                        std::cerr << optXY.name << " requires one argument";
                                        exit(1);
                                    }
                                }
                            }
                        } else if (options[x][y].set) {
                            std::cerr << "Option " << argv[i] << " is already set" << std::endl;
                        }
                    }
                } else {
                    break;
                }
            }
        }

        if (!found) {
            std::cerr << "Command " << argv[i] << " does not exist. Use " << help << " for help" << std::endl;
            exit(1);
        }
    }

    for (int x = gPos; x < nGroup; x++) {
        for (int y = 0; y < nOpt; y++) {
            if (optXY.required) {
                std::cerr << optXY.name << " must be set" << std::endl;
            }
        }
    }
}

void cmdParser::addHeading(const std::string &heading) {
    options[gPos][oPos].name = strdup(heading.c_str());
    oPos++;
}

void cmdParser::setArgMarker(const std::string &m) {
    free(argMarker);
    argMarker = strdup(m.c_str());
}

void cmdParser::addReplace(char toReplace, char replacement) {
    auto it = replaceMap.find(toReplace);
    if (it != replaceMap.end())
        it->second = replacement;
    else
        replaceMap.insert(std::make_pair(toReplace, replacement));
}

cmdParser::~cmdParser() {
    for (int x = 0; x < nGroup; ++x) {
        for (int y = 0; y < nOpt; y++) {
            free(options[x][y].tooltip);
            free(options[x][y].name);
        }
        delete options[x];
    }
    delete options;

    free(argMarker);
}

void cmdParser::addIndent(string &s, char *tooltip) {
    if (s.length() + 3 > indent) {
        s.append("\n").append(indent, ' ').append(tooltip);
    } else {
        int _indent = indent - (unsigned short) s.length();
        s.append(_indent, ' ').append(tooltip);
    }
}

void cmdParser::displayHelp() {
    std::cout << "------------------- Help -------------------" << std::endl;
    for (int x = 0; x < nGroup; x++) {
        for (int y = 0; y < nOpt; y++) {
            if (options[x][y].name != nullptr) {
                if (options[x][y].tooltip) {
                    std::string s("  ");
                    s.append(optXY.name);
                    if (optXY.valDesc) {
                        s.append(optXY.valDesc);
                    } else {
                        if (acceptsMultiple(optXY)) {
                            if (acceptsSingle(optXY)) {
                                s.append(" [<args...>]");
                            } else {
                                s.append(" <args...>");
                            }
                        } else if (acceptsSingle(optXY) && optXY.b == nullptr) {
                            s.append(" <arg>");
                        }
                    }
                    addIndent(s, optXY.tooltip);
                    std::cout << s;
                } else { // Heading
                    std::cout << " " << options[x][y].name;
                }
                std::cout << std::endl;
            } else {
                break;
            }
        }
    }
    node_quit();
}

void cmdParser::replaceAll(std::string &name) {
    for (std::pair<char, char> p : replaceMap) {
        std::replace(name.begin(), name.end(), p.first, p.second);
    }
}

void cmdParser::setHelpCommand(string cmd) {
    help = std::move(cmd);
    addArgMarker(help);
}
