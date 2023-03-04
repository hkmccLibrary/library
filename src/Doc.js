import { spreadsheetID } from "./api/spreadsheetID";
import config from "./api/config";
import header from "./api/header";

const { GoogleSpreadsheet } = require("google-spreadsheet");

const MAX_COLUMN = 26;
const ASCII_A = 65;

let sheetKey;
let callback = null;
if (process.env.NODE_ENV === "development")
{
    console.log("Development mode");
    sheetKey = "development";
}
else
{
    console.log("Production mode");
    sheetKey = "production";
}


function findHeader(value, headers)
{
    for (let h of headers)
        if (h === value) return true ;

    return false;
}

class Doc {
    constructor() {
        console.log("Create Doc class");
        this.doc = new GoogleSpreadsheet(spreadsheetID[sheetKey]);
        this.initialized = false;
        this.sheets = {};
    }

    async openDoc() {
        try {
            console.log('try to read sheet ' + Date.now());
            await this.doc.useServiceAccountAuth(config);
            console.log('Auth Done         ' + Date.now());
            await this.doc.loadInfo(); // loads document properties and worksheets
            console.log('Done              ' + Date.now());
            this.initialized = true;
        }
        catch (error)
        {
            console.log(error);
            return false;
        }
        console.log('Out of catch  ' + Date.now());
        return true;
    }

    isOpen() {
        return this.initialized;
    }

    getCachedList(name) {
        return new Set(Object.keys(this.sheets[name].cachedList));
    }

    async sheetsByTitle(arg) {

        if (arg in this.sheets)
        {
            return this.sheets[arg];
        }
        const sheet = await this.doc.sheetsByTitle[arg];

        // Find spreadsheet headers
        await sheet.loadCells('A1:Z1');
        const header = this.createHeader(arg, sheet);
        console.log(header);

        const sheetInfo = {sheet:sheet, name:arg, header:header, cachedList:{}};

        this.sheets[arg] = sheetInfo;
        return sheetInfo;
    }

    createHeader(name, tS)
    {
        if (!tS)
            return {};
        const h = {};
        const headerList = header[name];
        const headerIds = Object.keys(header[name]);
        console.log(headerIds);
        for (let i = 0 ; i < Math.min(MAX_COLUMN, tS.columnCount) ; i++)
        {
            const entry = tS.getCell(0, i);
            if (entry.valueType == null) continue;
            for (let label of headerIds) {
                if  (findHeader(entry.value, headerList[label])) {
                    h[label] = i;
                }
            }
        }
        return h;
    }

    async readList(name, cols, triggerCallback = true)
    {
        console.log("Read sheet " + name + " " + cols);
        const info = this.sheets[name];
        if (!info.sheet)
            return [];

        let cached = true;
        let lists = [];
        for (let i = 0 ; i < cols.length ; i++)
        {
            if (cols[i] in info.cachedList)
            {
                lists.push(info.cachedList[cols[i]]);
            }
            else
            {
                console.log("Not cached ", cols[i]);
                cached = false;
                break
            }
        }
        if (cached)
            return lists;
        for (let i = 0 ; i < cols.length ; i++)
            lists[i] = [];

        let rowIdx = 1;
        const ROW_RANGE = 5000;
        console.log(cols);
        const rowSize = info.sheet.rowCount;
        const colMin = cols[0];
        const colMax = cols[cols.length - 1];
        while (rowIdx < rowSize-1)
        {
            // Read ROW_RANGE cell
            const increment = Math.min(rowSize - rowIdx, ROW_RANGE);
            const query = String.fromCharCode(ASCII_A+colMin) + (rowIdx+1) + ":" +
                          String.fromCharCode(ASCII_A+colMax) + (rowIdx+increment);
            console.log(colMin.toString() + "~" + colMax.toString() + " " + query);
            try {
                await info.sheet.loadCells(query);
            }
            catch (error)
            {
                console.log(error);
                return;
            }


//            let nullCount = 0;
            console.log(increment)
            for (let i = 0 ; i < increment ; i++)
            {
                for (let j = 0 ; j < cols.length ; j++)
                {
                    const entry = info.sheet.getCell(rowIdx + i, cols[j]);
                    let id = null;
                    if (entry.valueType != null)
                    {
                        id = entry.formattedValue;
                    }
                    lists[j].push(id);
                }
            }
            // If all ROW_RANGE cells are empty, stop reading
//            if (nullCount === ROW_RANGE) break;
            rowIdx += increment;
        }

        for (let i = 0 ; i < cols.length ; i++)
        {
            info.cachedList[cols[i]] = lists[i];
        }
        console.log("Cached");
        console.log(info.cachedList);
        if (triggerCallback && callback != null)
        {
            callback();
        }
        return lists;
    }

    async getStudent(id) {
        const todaySheet = this.sheets["user"].sheet;
        if (!todaySheet)
            return null;

        // Locate student in the spreadsheet today
        let studentNumber = id;
        let studentRowNumber = await this.findStudentRow(studentNumber);

        if (!studentRowNumber) {
            return null;
        }

        const header = this.sheets["user"].header;
        // Student ID is found
        console.log("Student ID: " + studentNumber + " Index:" + studentRowNumber);
        const query = String.fromCharCode(ASCII_A) + (studentRowNumber) + ":" +
                      String.fromCharCode(ASCII_A+MAX_COLUMN-1) + (studentRowNumber);
        console.log(query);
        await todaySheet.loadCells(query);
        const idx = studentRowNumber - 1;
        console.log("Get Cell " + idx + " " + header.name);
        const name = todaySheet.getCell(idx, header.name);
        const checkIn = todaySheet.getCell(idx, header.checkIn);
        const checkOut = todaySheet.getCell(idx, header.checkOut);

        return {idx: idx, name: name, checkIn: checkIn, checkOut: checkOut};
    }

    async updateCell(name)
    {
        const todaySheet = this.sheets[name].sheet;
        if (!todaySheet)
            return null;
        await todaySheet.saveUpdatedCells();
    }

    async findStudentRow(ID) {
        const codeList = await this.readList("user", this.sheets["user"].header.code);
        console.log("finding student row " + codeList.length);
        for (let i = 0 ; i < codeList.length ; i++)
        {
            if (codeList[i] && codeList[i] === ID) return i + 1;
        }
        return null;
    }

    setCallback(updateFunc)
    {
        console.log("Update function registered");
        callback = updateFunc;
    }
}

export default Doc;

