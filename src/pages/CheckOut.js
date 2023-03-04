import React, { useEffect, useState } from "react";
import "./Page.css"
import { toast } from "react-toastify";
import Logo from "../images/logo.png";
import { useDebounce } from "use-debounce";
import { sleep, toastProp } from "../Util";

const selectedIds = new Set();

function CheckOut(props) {
    const [inputText, setInputText] = useState("");
    const [studentList, setStudentList] = useState([]);
    const [rentList, setRentList] = useState([]);
    const [bookList, setBookList] = useState([]);
    const [searchQuery] = useDebounce(inputText, 50);
    const [searchResults, setSearchResults] = useState([]);
    const [selectedId, selectIdImpl] = useState({code:-1});
    const [initialized, setInitialized] = useState(false);

    useEffect(function () {
        async function initialize() {
            toast.dismiss();
            while (!props.doc.isOpen()) {
                await sleep(0.1);
            }
            console.log("CheckOut initialize");
            console.log(props.text);

            const userSheet = await props.doc.sheetsByTitle('user');
            const rentSheet = await props.doc.sheetsByTitle('rent');
            const bookSheet = await props.doc.sheetsByTitle('book');
            if (!userSheet || !rentSheet || !bookSheet)
            {
                const prop = toastProp;
                prop.autoClose = 3000;
                toast.error(props.text.failedToOpen, prop);
                return;
            }
            console.log(userSheet.header);
            console.log(userSheet.header["name"]);
            const cachedUserData = props.doc.getCachedList("user");
            const cachedRentData = props.doc.getCachedList("rent");
            let initNoti = null;
            if (!cachedUserData.has(userSheet.header.code.toString()) ||
                !cachedUserData.has(userSheet.header.name.toString()) ||
                !cachedRentData.has(rentSheet.header.barcode.toString()) ||
                !cachedRentData.has(rentSheet.header.user.toString()) ||
                !cachedRentData.has(rentSheet.header.rentDate.toString()) ||
                !cachedRentData.has(rentSheet.header.returnDate.toString()) )
            {
                console.log("Data should be loaded");
                const prop = toastProp;
                prop.autoClose = false;
                initNoti = toast.info(props.text.loading, prop);
                console.log(props.text.loading);
            }

            console.log(bookSheet.header);

            console.log(userSheet.name);
            let userLists;
            userLists = await props.doc.readList("user", [userSheet.header.code,
                                                          userSheet.header.name]);
            const codeList = userLists[0];
            const nameList = userLists[1];

            let rentLists;
            rentLists = await props.doc.readList("rent", [rentSheet.header.barcode,
                                                          rentSheet.header.user,
                                                          rentSheet.header.rentDate,
                                                          rentSheet.header.returnDate]);
            const rentedList = rentLists[0];
            const renterList = rentLists[1];
            const rentDates = rentLists[2];
            const returnDates = rentLists[3];

            const userList = [];
            const rentList = [];
            for (let i = 0 ; i < Math.min(codeList.length, nameList.length); i++)
            {
               userList.push({code: codeList[i],  name: nameList[i]});
            }
            setStudentList(userList);
            for (let i = 0 ; i < Math.min(codeList.length, nameList.length); i++)
            {
               rentList.push({code: rentedList[i],  user: renterList[i], rentDate: rentDates[i], returnDate: returnDates[i]});
            }
            setRentList(rentList);

            loadBook(bookSheet.header);

            console.log("Sheet read " + userList.length);
            if (initNoti) {
                const prop = toastProp;
                prop.type = toast.TYPE.SUCCESS;
                prop.autoClose = 3000;
                prop.render = props.text.succeededToOpen;
                toast.update(initNoti, prop);
            }
            setInitialized(true);
        }
        initialize();
        return () => toast.dismiss();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(
        () => {
            async function findStudents(text) {
                let results = [];

                for (const row of studentList) {
                    if (results.length > 4) break;
                    if ((row.code && row.code.toString().includes(text)) ||
                        (row.name && row.name.toString().includes(text)))
                    {
                        let resultString = `${row.code}: ${row.name}`;
                        let resultObject = {
                            code: row.code,
                            name: row.name,
                            text: resultString,
                        };
                        results.push(resultObject);
                        selectedIds.add(row.code);
                    }
                }
                return results;
            }
            async function query() {
                if (searchQuery) {
                    let sr = await findStudents(searchQuery);
                    if (sr.length > 0)
                    {
                        setSearchResults(sr);
                    }
                    else
                    {
                        console.log("No matching student");
                        setSearchResults([]);
                    }
                } else {
                    console.log("No matching student");
                    setSearchResults([]);
                }
            }
            query();
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [searchQuery, studentList]
    );

    const selectId = async (code) => {
//        const info = await props.doc.getStudent(code);
        console.log("Select " + selectedId.code + " " + code);
        console.log(selectedId);
        if (!selectedId || !selectedId.code || selectedId.code !== code)
        {
            console.log("Selected");
//            console.log(info);
            selectIdImpl({code:code});
        }
        else
        {
            console.log("Deselect");
            selectIdImpl({code:-1});
        }
    }

    const showRented = (rent) => {
        const rentDate = rent.rentDate.split(' ')[0];
        console.log(rentDate);
        let bookName = "";
        for (let i = 0 ; i < bookList.length ; i++)
        {
            if (bookList[i].code === rent.code)
                bookName = bookList[i].name;
        }
        return (<tr key = {rent.code}>
                    <td> {bookName} </td>
                    <td> {rentDate} </td>
                    <td> {rent.returnDate} </td>
                </tr>);
    }

    const loadBook = async (header) => {
        let bookLists;
        bookLists = await props.doc.readList("book", [header.barcode,
                                                      header.name]);
        const bookCodes = bookLists[0];
        const bookNames = bookLists[1];

        for (let i = 0 ; i < bookCodes.length; i++)
        {
           bookList.push({code: bookCodes[i], name: bookNames[i]})
        }
        setBookList(bookList);
        console.log("Book loaded " + bookList.length.toString());
    }

    const showEntries = (result) => {
        const hidden = (selectedId.code !== result.code);
        let rented = []
        if (!hidden)
        {
            for (let rent of rentList)
            {
                if (rent.user === result.code)
                {
                    console.log(rent);
                    rented.push(rent);
                }
            }
        }
        return (<div key={result.code}><button type="button" id="searchResult" onClick={async () => {await selectId(result.code);}}> {result.text} </button>
                    <div hidden={hidden}>
                        <table><tbody>
                        <tr><th id="bookname">{props.text.bookName}</th>
                            <th id="rentDate">{props.text.rentDate}</th>
                            <th id="returnDate">{props.text.returnDate}</th></tr>
                        {
                            rented.map((rent) => {
                                return showRented(rent);
                            })
                        }
                        </tbody></table>
                    </div>
                </div>);
    }

    return (
        <div id="checkOut">
            <div id="title">
                <img id="logo" src={Logo} alt="HKMCC" ></img>
                <h1>{props.text.checkOutTitle}</h1>
            </div>
            <div id="checkOutInput" >
                <input id="searchInput"
                    placeholder={props.text.searchUser}
                    value={inputText}
                    disabled={!initialized}
                    onChange={(event) => {
                        setInputText(event.target.value);
                    }} />

                {
                    searchResults.map((result) => {
                        return showEntries(result);
                    })
                }
            </div>
        </div>
    );
}

export default CheckOut;
