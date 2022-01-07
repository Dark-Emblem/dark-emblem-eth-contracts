const expectThrowsAsync = async (method, errorMessage) => {
    let error = null;

    try {
        await method();
    } catch (err) {
        error = err;
    }

    expect(error).to.be.an("Error");

    if (errorMessage) {
        expect(error.message).to.match(errorMessage);
    }
};

const expectNotThrowsAsync = async (method) => {
    let error = null;
    let v = null;

    try {
        v = await method();
    } catch (err) {
        error = err;
    }

    if (error) {
        // print the stack trace
        console.error(error.stack);
    }

    expect(error).to.be.null;

    return v;
};

module.exports = {
    expectThrowsAsync,
    expectNotThrowsAsync,
};
