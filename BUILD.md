# Build autobet

## Prerequisites
* [Node.js](https://nodejs.org/en/) version >= 12.14.0 with npm
* [Git](https://git-scm.com/)
* [CMake](https://cmake.org/download/) version >= 3.15
* [Npm](https://www.npmjs.com/get-npm) version >= 6.14 (Some older versions may also work)
* [conan](https://conan.io/downloads.html)

## First steps
* Clone the repository: ``git clone https://github.com/MarkusJx/autobet``
* Initialize all submodules: ``git submodule init``
* Update all submodules: ``git submodule update``

## Build steps
For newer versions of autobet, run these steps in a command line with 
*node.js, npm, git, cmake and electron-builder* enabled:
* ``npm install && npm --prefix ./web-ui install && npm --prefix ./autobetlib install`` to install all required files or
* ``pnpm -r -F !./autobetlib/external/** install`` if you want to use pnpm
* ``npm run build`` to build the native library

## Packaging
To package autobet, run:<br>
``npm run-script pack``

## Run it
To test and run autobet, simply execute:<br>
``npm start`` (This will also run the build step, sou you don't have to run it yourself)
