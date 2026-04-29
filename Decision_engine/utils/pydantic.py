def copy_model(model, deep: bool = True):
    if hasattr(model, "model_copy"):
        return model.model_copy(deep=deep)
    return model.copy(deep=deep)


def model_to_dict(model):
    if model is None:
        return None
    if hasattr(model, "model_dump"):
        return model.model_dump(mode="python")
    return model.dict()
