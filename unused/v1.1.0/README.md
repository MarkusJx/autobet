# Autobet v1.1.0
In here you can find all the code which is now unused as of version 1.2.0. Version switched
from using [CppJsLib](https://github.com/MarkusJx/CppJsLib) to node.js for communication
between the backend and the frontend. CppJsLib is still used for communication with the web
ui.

## Compile instructions
You will have to replace some files in the main repo with all files in here. Or you
could just checkout the ``1.1.0`` branch.

#### Electron installation
* Install electron ``npm i -D electron@latest``
* Clone the electron-quick-start repo ``git clone https://github.com/electron/electron-quick-start``
* Copy the contents of the electron folder into the electron-quick-start folder ``cp -R electron/. electron-quick-start``
* Copy the contents of the electron-quick-start folder into the electron folder ``cp -R electron-quick-start/. electron``
* cd into the electron folder ``cd electron``
* Install the electron prerequisites ``npm install``
* Install electron packager ``npm install electron-packager``
* Change directory back to the main directory ``cd ..``
* Create the electron package ``electron-packager electron``

#### Compile
##### Compile AI
* Follow the instructions [over here](https://www.tensorflow.org/install/source_windows?lang=python3)
* copy the ``ai`` folder into ``<tensorflow-src>/tensorflow``
* Make sure you've created the config file for tensorflow
* Run ``bazel build --config=opt //tensorflow/ai:ai.dll`` in folder ``<tensorflow-src>``
* The build will take about 1-2 hours
* The resulting .dll and .lib will be stored in ``<tensorflow-src>/bazel-bin/tensorflow/ai``

##### Compile Autobet
* Create folder ``<autobet-src>/include``
* Create folder ``<autobet-src>/lib``
* Copy ``<autobet-src>/ai/ai.h`` into ``<autobet-src>/include``
* Put ``httplib.h`` and ``json.hpp`` into ``<autobet-src>/include``
* Copy ``<tensorflow-src>/bazel-bin/tensorflow/ai/ai.dll.if.lib`` into ``<autobet-src>/lib``
* Download [zip](https://github.com/kuba--/zip) and unpack it
* Create folder ``<autobet-src>/src/zip``
* Copy all contents from ``<zip-src>/src`` into ``<autobet-src>/src/zip``
* Download [CppJsLib](https://github.com/MarkusJx/CppJsLib) and unpack it
* Create folder ``<autobet-src>/src/CppJsLib``
* Copy all contents from ``<cppjslib-src>/src`` into ``<autobet-src>/src/CppJsLib``
* Create folder ``<autobet-src>/build`` and cd into it
* Run ``cmake .. -DBUILD_CPPJSLIB=TRUE``
* Run ``cmake --build . --config Release``
* Copy ``<tensorflow-src>/bazel-bin/tensorflow/ai/ai.dll`` into ``<autobet-src>/build/src/Release``
* Copy ``<autobet-src>/ui`` into ``<autobet-src>/build/src/Release``
* Copy ``<autobet-src>/web`` into ``<autobet-src>/build/src/Release``
* Copy ``<cppjslib-src>/CppJsLibJs`` into ``<autobet-src>/build/src/Release``