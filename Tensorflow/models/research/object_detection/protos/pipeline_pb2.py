# -*- coding: utf-8 -*-
# Generated by the protocol buffer compiler.  DO NOT EDIT!
# source: object_detection/protos/pipeline.proto
# Protobuf Python Version: 4.25.2
"""Generated protocol buffer code."""
from google.protobuf import descriptor as _descriptor
from google.protobuf import descriptor_pool as _descriptor_pool
from google.protobuf import symbol_database as _symbol_database
from google.protobuf.internal import builder as _builder
# @@protoc_insertion_point(imports)

_sym_db = _symbol_database.Default()


from object_detection.protos import eval_pb2 as object__detection_dot_protos_dot_eval__pb2
from object_detection.protos import graph_rewriter_pb2 as object__detection_dot_protos_dot_graph__rewriter__pb2
from object_detection.protos import input_reader_pb2 as object__detection_dot_protos_dot_input__reader__pb2
from object_detection.protos import model_pb2 as object__detection_dot_protos_dot_model__pb2
from object_detection.protos import train_pb2 as object__detection_dot_protos_dot_train__pb2


DESCRIPTOR = _descriptor_pool.Default().AddSerializedFile(b'\n&object_detection/protos/pipeline.proto\x12\x17object_detection.protos\x1a\"object_detection/protos/eval.proto\x1a,object_detection/protos/graph_rewriter.proto\x1a*object_detection/protos/input_reader.proto\x1a#object_detection/protos/model.proto\x1a#object_detection/protos/train.proto\"\x95\x03\n\x17TrainEvalPipelineConfig\x12\x36\n\x05model\x18\x01 \x01(\x0b\x32\'.object_detection.protos.DetectionModel\x12:\n\x0ctrain_config\x18\x02 \x01(\x0b\x32$.object_detection.protos.TrainConfig\x12@\n\x12train_input_reader\x18\x03 \x01(\x0b\x32$.object_detection.protos.InputReader\x12\x38\n\x0b\x65val_config\x18\x04 \x01(\x0b\x32#.object_detection.protos.EvalConfig\x12?\n\x11\x65val_input_reader\x18\x05 \x03(\x0b\x32$.object_detection.protos.InputReader\x12>\n\x0egraph_rewriter\x18\x06 \x01(\x0b\x32&.object_detection.protos.GraphRewriter*\t\x08\xe8\x07\x10\x80\x80\x80\x80\x02')

_globals = globals()
_builder.BuildMessageAndEnumDescriptors(DESCRIPTOR, _globals)
_builder.BuildTopDescriptorsAndMessages(DESCRIPTOR, 'object_detection.protos.pipeline_pb2', _globals)
if _descriptor._USE_C_DESCRIPTORS == False:
  DESCRIPTOR._options = None
  _globals['_TRAINEVALPIPELINECONFIG']._serialized_start=268
  _globals['_TRAINEVALPIPELINECONFIG']._serialized_end=673
# @@protoc_insertion_point(module_scope)
