import React, { useEffect, useState } from "react";
import "./Page.css"
import { toast } from "react-toastify";
import Logo from "../images/logo.png";
import { useDebounce } from "use-debounce";
import { sleep, SEARCH_PER_SCREEN, MAX_SEARCH_ENTRY } from "../Util";

let initialized = false;

function Search(props) {
    const [inputText, setInputText] = useState("");
    const [searchQuery] = useDebounce(inputText, 50);
    const [searchResults, setSearchResults] = useState([]);
    const [displayedCodes, setDisplayedCodes] = useState([]);
    const [pageNum, setPageNum] = useState(0);
    const [selectedId, setSelectedId] = useState(0);

    const [bookList, setBookList] = useState([]);
    const [rentList, setRentList] = useState([]);

    useEffect(function () {
        async function initialize() {
//            toast.dismiss();
            props.doc.setCallback(updateDoc);
            while (!props.doc.isOpen()) {
                await sleep(0.1);
            }

/*
            const rentSheet = await props.doc.sheetsByTitle('rent');
            const bookSheet = await props.doc.sheetsByTitle('book');

            if (!rentSheet || !bookSheet)
            {
                const prop = toastProp;
                prop.autoClose = 3000;
                toast.error(text.failedToOpen, prop);
                return;
            }
            const cachedRentData = props.doc.getCachedList("rent");
            const cachedBookData = props.doc.getCachedList("book");
            if (!cachedRentData.has(rentSheet.header.barcode.toString()) ||
                !cachedBookData.has(bookSheet.header.barcode.toString()) ||
                !cachedBookData.has(bookSheet.header.name.toString()))
            {
                console.log("Data should be loaded");
                const prop = toastProp;
                prop.type = toast.TYPE.LOADING;
                prop.autoClose = false;
            }

            props.doc.readList("rent", [rentSheet.header.barcode]);
            props.doc.readList("rent", [rentSheet.header.returnDate]);
            props.doc.readList("book", [bookSheet.header.barcode, bookSheet.header.name]);
*/
            console.log("Data should be loaded");
        }
        initialize();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(
        () => {
            async function findBooks(text) {
                let results = [];

                for (let i = 0 ; i < bookList.length ; i++) {
                    const row = bookList[i];
                    if (results.length >= MAX_SEARCH_ENTRY) break;
                    if (row.name && row.name.toString().includes(text))
                    {
                        let resultString = `${row.name}`;
                        let rent = props.text.available;
                        let retDate = "";
                        for (const entry of rentList)
                        {
                            if (entry.code === row.code)
                            {
                                if (entry.state === "1")
                                {
                                    rent = props.text.checkedOut;
                                    retDate = props.text.returnDate + " " + entry.retDate;
                                }
                                else if (entry.state === "3")
                                {
                                    rent = props.text.overDue;
                                    retDate = props.text.returnDate + " " + entry.retDate;
                                }
                                else
                                {
                                    rent = props.text.notAvailable;
                                }

                                break;
                            }
                        }
//                        if (rentList.includes(row.code))
//                            rent = props.text.checkedOut;
//                        else
//                            rent = props.text.available;
                        let resultObject = {
                            index: i,
                            text: resultString,
                            name: row.name,
                            code: row.code.toString(),
                            rent: rent,
                            retDate: retDate
                        };
                        results.push(resultObject);
                    }
                }
                return results;
            }
            async function query() {
                if (searchQuery) {
                    let sr = await findBooks(searchQuery);
                    if (sr.length > 0) setSearchResults(sr);
                    else setSearchResults([]);
                } else {
                    setSearchResults([]);
                }
                setPageNum(0);
            }
            query();
        },
        [searchQuery, bookList, rentList, props]
    );

    useEffect(
        () => {
            const length = searchResults.length;
                console.log("Page num " + pageNum.toString);
            if (length > SEARCH_PER_SCREEN)
            {
                const startIdx = pageNum * SEARCH_PER_SCREEN;
                const count = Math.min(SEARCH_PER_SCREEN, length - startIdx);
                setDisplayedCodes(searchResults.slice(startIdx,startIdx+count));
            }
            else
            {
                setDisplayedCodes(searchResults);
                setPageNum(0);
            }
        }, [searchResults, pageNum]
    );

    async function updateDoc()
    {
        console.log("All data loaded " + initialized);
        initialized = true;
        toast.dismiss();
        /*
        const prop = toastProp;
        prop.type = toast.TYPE.SUCCESS;
        prop.render = props.text.succeededToOpen;
        prop.autoClose = 3000;
        toast.info(props.text.loading, prop);
        */
        console.log("Done");
        let rl = [];
        const rented = props.doc.rent;
        for (let i = 0 ; i < rented.length; i++)
        {
           rl.push({code:rented[i].book_id, retDate:rented[i].return_date, state:rented[i].state});
        }
        setRentList(rl);

        let bl = [];
        const books = props.doc.book
        for (let i = 0 ; i < books.length; i++)
        {
           bl.push({code: books[i]._id, name: books[i].title, author: books[i].author, claim: books[i].claim,
                    totalName: "", category: books[i].publisher, publish: books[i].publisher});
        }
        setBookList(bl);
    /*
        const rentSheet = await props.doc.sheetsByTitle('rent');
        const bookSheet = await props.doc.sheetsByTitle('book');
        const cachedRentData = props.doc.getCachedList("rent");
        const cachedBookData = props.doc.getCachedList("book");
        if (!initialized &&
            cachedRentData.has(rentSheet.header.barcode.toString()) &&
            cachedBookData.has(bookSheet.header.barcode.toString()) &&
            cachedBookData.has(bookSheet.header.name.toString()) &&
            bookList.length === 0 &&
            rentList.length === 0)
        {
            console.log("All data loaded " + initialized);
            let rentLists;
            rentLists = await props.doc.readList("rent", [rentSheet.header.barcode, rentSheet.header.returnDate]);
            const rented = rentLists[0];
            const retDate = rentLists[1];

            let bookLists;
            bookLists = await props.doc.readList("book", [bookSheet.header.barcode, bookSheet.header.name]);
            const bookCodes = bookLists[0];
            const bookNames = bookLists[1];

            let rl = [];
            for (let i = 0 ; i < rented.length; i++)
            {
               rl.push({code:rented[i], retDate:retDate[i]});
            }
            setRentList(rl);

            let bl = [];
            for (let i = 0 ; i < bookCodes.length; i++)
            {
               bl.push({code: bookCodes[i], name: bookNames[i]})
            }
            setBookList(bl);
//            setInitialized(1);
            initialized = true;

            props.doc.readList("book", [bookSheet.header.author, bookSheet.header.totalName, bookSheet.header.category]);
            props.doc.readList("book", [bookSheet.header.claim, bookSheet.header.publish]);

            const prop = toastProp;
            prop.type = toast.TYPE.SUCCESS;
            prop.render = props.text.succeededToOpen;
            prop.autoClose = 3000;
            toast.update(initNoti, prop);
            console.log("Done");
        }
        if (cachedBookData.has(bookSheet.header.author.toString()) &&
            cachedBookData.has(bookSheet.header.claim.toString()) &&
            cachedBookData.has(bookSheet.header.barcode.toString()) &&
            cachedBookData.has(bookSheet.header.name.toString()) &&
            cachedBookData.has(bookSheet.header.totalName.toString()) &&
            cachedBookData.has(bookSheet.header.category.toString()) &&
            cachedBookData.has(bookSheet.header.publish.toString()))
        {
            console.log("Collected all book details");
            const books = await props.doc.readList("book", [bookSheet.header.name,
                                                            bookSheet.header.barcode,
                                                            bookSheet.header.author,
                                                            bookSheet.header.claim,
                                                            bookSheet.header.totalName,
                                                            bookSheet.header.category,
                                                            bookSheet.header.publish], false);
            let bl = [];
            for (let i = 0 ; i < books[0].length; i++)
            {
               bl.push({code: books[1][i], name: books[0][i], author: books[2][i], claim: books[3][i],
                        totalName: books[4][i], category: books[5][i], publish: books[6][i]});
            }
            setBookList(bl);
            console.log("Set Book List " + bl.length);
        }
*/
    }

    function movePrev() {
        if (pageNum > 0)
        {
            setPageNum(pageNum - 1);
        }
    }

    function moveNext() {
        if (searchResults.length > (pageNum + 1) * SEARCH_PER_SCREEN)
        {
            setPageNum(pageNum + 1);
        }
    }

    const selectId = async (id) => {
        if (selectedId === -1 || selectedId !== id)
        {
            console.log("Select " + id);
            setSelectedId(id);
        }
        else
        {
            console.log("Deselect " + id);
            setSelectedId(-1);
        }
    }

    const showEntry = (result) => {
        const hidden = (result.index !== selectedId);
        const bookInfo = bookList[result.index];
        const entryId = (hidden) ? "searchResult" : "selectedSearchResult";
        return (
            <div key={result.code}>
            <div id={entryId} onClick={async () => await selectId(result.index)}>
                <table><tbody>
                    <tr className="searchTr">
                        <td className="searchTitle"> {result.text}</td>
                        <td className="searchRent"> {result.rent} </td>
                    </tr>
                </tbody></table>
            </div>
            {!hidden &&
            <div>
                <table><tbody>
                <tr>
                    <td>{bookInfo.author} </td>
                    <td colSpan="2" rowSpan="2">{bookInfo.totalName} <b>{bookInfo.name}</b></td>
                </tr>
                <tr>
                    <td>{bookInfo.code} </td>
                </tr>
                <tr>
                    <td>{bookInfo.publish}</td>
                    <td>{bookInfo.claim} </td>
                    <td>{result.retDate}</td>
                </tr>
                </tbody></table>
            </div>
            }
            </div>
        );
    }

    return (
        <div id="search">
            <div id="title">
                <img id="logo" src={Logo} alt="HKMCC" ></img>
                <h1> {props.text.searchTitle} </h1>
            </div>
            <div id="searchContents" >
                <input id="searchInput"
                    placeholder={props.text.searchBook}
                    value={inputText}
                    onChange={(event) => {
                        setInputText(event.target.value);
                    }} />

                {displayedCodes.map((result) => showEntry(result))}
            </div>
            {searchResults.length > SEARCH_PER_SCREEN && (
                <div id="pageControl">
                <table><tbody><tr>
                    <td className="page">
                        {pageNum !== 0 ?
                         <button id="prevPage" hidden onClick={movePrev}> &lt;&lt; </button> : null}
                    </td>

                    <td className="page" id="pageNum"> {pageNum+1} </td>
                    <td className="page">
                        {searchResults.length > (pageNum + 1) * SEARCH_PER_SCREEN ?
                         <button id="nextPage" onClick={moveNext}> &gt;&gt; </button> : null }
                    </td>
                </tr></tbody></table>
                </div>
            )}
        </div>
    );
}

export default Search;
