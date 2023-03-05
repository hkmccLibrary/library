class Doc {
    constructor() {
        console.log("Create Doc class");
        this.initialized = false;
        this.sheets = {};
        this.bookReady = false;
        this.rentReady = false;
    }

    checkState() {
        if (this.bookReady && this.rentReady) {
            this.initialized = true;
            if (this.callback) {
                this.callback();
            }
        }

    }

    setRent(rent) {
        this.rent = rent
        this.rentReady = true;
        this.checkState();
    }

    setBook(book) {
        this.book = book
        this.bookReady = true;
        this.checkState();
    }

    async openDoc() {
        try {
            this.initialized = true;
        }
        catch (error)
        {
            console.log(error);
            return false;
        }
        return true;
    }

    isOpen() {
        return this.initialized;
    }

    getCachedList(name) {
        return new Set(Object.keys(this.sheets[name].cachedList));
    }

    async updateCell(name)
    {
        const todaySheet = this.sheets[name].sheet;
        if (!todaySheet)
            return null;
        await todaySheet.saveUpdatedCells();
    }

    setCallback(updateFunc)
    {
        console.log("Update function registered");
        this.callback = updateFunc;
    }
}

export default Doc;

