from bson import ObjectId

def serialize_mongo(doc):
    if isinstance(doc, list):
        return [serialize_mongo(d) for d in doc]

    if isinstance(doc, dict):
        return {k: serialize_mongo(v) for k, v in doc.items()}

    if isinstance(doc, ObjectId):
        return str(doc)

    return doc
