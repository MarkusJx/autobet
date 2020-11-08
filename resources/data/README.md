# Autobet model

The model required for autobet is not located in the repo but can be downloaded
[here](https://www.dropbox.com/sh/o2gjouprivq9th4/AACDfj-emT-kpENpUeBMJvuMa?dl=0).
The required files is called ``optimized_model.pb`` and must be renamed to
``model.pb`` in order for autobet to use it. In the shared folder you can also
find the raw model, not converted to a ``.pb`` file and not optimized, and the
``transform_graph.exe`` used to optimize the model.

**NOTE**: The ``optimized_model.pb`` file will be automatically downloaded and properly
placed in this folder when running ``npm install``.