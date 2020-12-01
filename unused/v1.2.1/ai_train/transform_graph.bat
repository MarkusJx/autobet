@ECHO OFF
transform_graph.exe --in_graph=model.pb --out_graph=optimized_model.pb --inputs="input_1" --outputs="predictions/Softmax" --transforms="remove_nodes(op=Identity, op=CheckNumerics) merge_duplicate_nodes strip_unused_nodes(type=float, shape=\"1,299,299,3\") fold_constants(ignore_errors=true) fold_batch_norms fold_old_batch_norms"
PAUSE