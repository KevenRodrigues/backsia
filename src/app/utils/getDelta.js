function getDelta(source: Array<T>, updated: Array<T>): Delta<T> {
    const added = updated.filter(
        updatedItem =>
            source.find(sourceItem => sourceItem.id === updatedItem.id) ===
            undefined
    );
    const changed = source.filter(
        sourceItem =>
            updated.find(updatedItem => updatedItem.id === sourceItem.id) !==
            undefined
    );
    const deleted = source.filter(
        sourceItem =>
            updated.find(updatedItem => updatedItem.id === sourceItem.id) ===
            undefined
    );

    const delta: Delta<T> = {
        added,
        changed,
        deleted,
    };

    return delta;
}

export default getDelta;
