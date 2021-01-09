# Build autobet

## Prerequisites
* [Node.js](https://nodejs.org/en/) version >= 12.14.0 with npm
* [Git](https://git-scm.com/)
* [CMake](https://cmake.org/download/) version >= 3.15
* [Npm](https://www.npmjs.com/get-npm) version >= 6.14 (Some older versions may also work)
* [conan](https://conan.io/downloads.html)

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
