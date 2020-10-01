# Ai_train

This folder contains all files required to train the ais.
Use ```resize()``` in ``ai.py`` to resize the images to create enough data
to train the ai. Then, use ``train_betting()`` or ``train_winnings()``
to train one of the ais.

Use ```freeze.py``` to freeze the models to a ``.pb`` file.

The ``.pb`` file can be optimized with ``transform_graph.bat`` and
the [tensorflow transform_graph tool](https://github.com/tensorflow/tensorflow/blob/master/tensorflow/tools/graph_transforms/README.md).