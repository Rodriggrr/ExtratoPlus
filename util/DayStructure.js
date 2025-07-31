class DayStructure {
    constructor(day) {
        this.day = day;
        this.entries = [];
    }

    addEntry(entry) {
        this.entries.push(entry);
    }

    getEntries() {
        return this.entries;
    }

    clearEntries() {
        this.entries = [];
    }

    getDay() {
        return this.day;
    }
    setDay(day) {
        this.day = day;
    }
}
