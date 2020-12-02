# Build autobet

## Prerequisites
* [Node.js](https://nodejs.org/en/) version >= 12.14.0
* [Git](https://git-scm.com/)
* [CMake](https://cmake.org/download/) version >= 3.15
* [Npm](https://www.npmjs.com/get-npm) version >= 6.14 (Some older versions may also work)
* [electron-builder](https://www.electron.build/) installed globally
(run ``npm install -g electron-builder``) version = 22.9.1
(this one for sure works, any other versions may work as well)
* [cmake-js](https://www.npmjs.com/package/cmake-js) installed globally
(run ``npm install -g cmake-js``) version = 6.1.0
(this one for sure works, any other versions may work as well)
* [chocolatey](https://chocolatey.org/install) for installing boost
* [Boost](https://chocolatey.org/packages/boost-msvc-14.1) installed using chocolatey
(run ``choco install -y boost-msvc-14.1 --version 1.67.0`` in an elevated cmd) version >= 1.67.0
* [OpenCV](https://opencv.org/releases/) any version greater than 4.0.0
(The ``OpenCV_DIR`` environment variable must be set to the OpenCV directory)

## Build steps
For newer versions of autobet, run these steps in a command line with 
*node.js, npm, git, cmake and electron-builder* enabled:
* ``npm install`` to install all required files
* ``npm run-script build`` to build the native library

## Packaging
To package autobet, run:<br>
``npm run-script pack``

## Run it
To test and run autobet, simply execute:<br>
``npm start`` (This will also run the build step, sou you don't have to run it yourself)
