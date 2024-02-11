import React, { useEffect, useState } from "react";
import "./Page.css"
import { toast } from "react-toastify";
import { toastProp, loggingId, loadingId, getUserState } from "../Util";
import { useDebounce } from "use-debounce";
//import CameraAltIcon from '@mui/icons-material/CameraAlt';
import ListView from "../ListView";
import { useNavigate, useParams } from "react-router-dom";

const State = {
    LoggedOut: 0,
    LoggingIn: 1,
    LoggedIn:  2,
    LoggingOut: 3
}

function CheckOut(props) {
    const [userId, setUserId] = useState("");

    const [bookText, setBookText] = useState("");
    const [bookValue] = useDebounce(bookText, 500);
    const [bookId, setBookId] = useState("");

    const [needConfirm, setNeedConfirm] = useState(false);

    const [barcode, setBarcode] = useState("");

    const [notifyRequest, setNotifyRequest] = useState({});

    const [rented, setRented] = useState([]);
    const [userData, setUserData] = useState({});
    const [bookData, setBookData] = useState({});
    const [state, setState] = useState(State.LoggedOut);

    const { id } = useParams();

    const navigate = useNavigate();

    useEffect(function () {
        async function initialize() {
            console.log("=======================================");
            console.log("CheckOut initialize");
            const prefixList = document.getElementsByName("idPrefix");
            for (var i = 0 ; i < prefixList.length ; i++)
            {
                const prefix = prefixList[i].id
                if ("AB" === prefix)
                    prefixList[i].checked = true
                else
                    prefixList[i].checked = false

            }
            console.log("ID: " + id);
            if (id && id.length !== 0)
            {
//                setBarcode(id)
                setUserId(id);
                logIn(id);
            }
        }

        const interval = setInterval(async () => {
//            console.log(props.doc.serverInfo);
            if (!("localIp" in props.doc.serverInfo) || !("port" in props.doc.serverInfo))
                return;
            if (props.doc.admin)
                return;
            import("./PageServer.css");
            const ipAddr = props.doc.serverInfo.localIp;
            const portNum = props.doc.serverInfo.port;
            if (ipAddr.length > 0 && portNum > 0)
            {
                const url = "https://" + ipAddr + ":" +
                    portNum + "/scanBarcode";
                const response = await props.doc.requestGet(url, {});
                const code = response.data.scan;
                if (code) {
                    console.log(code)
                    console.log(state)
                    setBarcode(code)
                }
            }
        }, 1000)

        initialize();
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(
        () => {
            console.log("Updated id: " + id);
        }, [id]
    );

    useEffect(
        () => {
            if (!barcode)
                return;
            console.log("Updated barcode: " + barcode);
            console.log("state : " + state);
            if (state === State.LoggedIn)
                setBookId(barcode);
            else if (state === State.LoggedOut)
                logIn(barcode);
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [barcode]
    );

    useEffect(
        () => {
            console.log("User data updated ");
            console.log(toast.isActive(loggingId));
            const prop = toastProp;

            let text;
            let notify = false;
            if ("USER_CODE" in userData && state !== State.LoggedIn)
            {
                console.log("Set state to LoggedIn from " + state);
                setState(State.LoggedIn);

                prop.type = toast.TYPE.SUCCESS;
                text = props.text.logInSucceed;
                notify = true;
            }
            else if (!("USER_CODE" in userData))
            {
                console.log("Set state to LoggedOut from " + state);

                if (state === State.LoggingIn)
                {
                    prop.type = toast.TYPE.ERROR;
                    text = props.text.logInFail;
                    notify = true;
                }
                setState(State.LoggedOut);
            }

            if (notify)
            {
                setNotifyRequest({"id": loadingId,
                                  "text": text,
                                  "type": prop.type})
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [userData]
    );

    useEffect(
        () => {
            console.log("book updated ");
            if ("BARCODE" in bookData)
            {
                if (bookData._STATE === 0)
                {
                    setNeedConfirm(true);
                }
                else
                {
                    setNotifyRequest({"id": loadingId,
                                      "text": props.text.RENTED,
                                      "type": toast.TYPE.ERROR})
                    setNeedConfirm(false);
                }
            }
            else
            {
                setNeedConfirm(false);
//                setBarcode("")
                setBookId("");
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [bookData]
    );

    useEffect(
        () => {
            if (! ("text" in notifyRequest))
                return

            toast.dismiss();
            console.log("Notification " + notifyRequest.text)
            const prop = toastProp;
            prop.type = notifyRequest.type
            prop.autoClose = 3000;
//            let id = 0
//            if ("id" in notifyRequest)
//                id = notifyRequest.id

//            prop.toastId = id
//            if (toast.isActive(id))
//                toast.update(id, notifyRequest.text, prop);
//            else
                toast.info(notifyRequest.text, prop);
//            setNotifyRequest({})
        },
        [notifyRequest]
    );

/*
    useEffect(
        () => {
            if (state === State.LoggedIn)
                return;

            const prefixList = document.getElementsByName("idPrefix");
            var prefix = ""
            for (var i = 0 ; i < prefixList.length ; i++)
            {
                if (prefixList[i].checked)
                    prefix = prefixList[i].id
                    console.log("Pressed [" + i.toString() + " " + prefix + "]")

            }
            let _userId;
            if (userValue[0] === "A" || userValue[0] === "a")
                _userId = userValue;
            else
                _userId = prefix + userValue;
//                setBarcode(_userId);
            setUserId(_userId);

        }, [state, userValue]
    );
*/

    const getUserData = async (userText) => {
        const url = "https://" + props.doc.serverInfo.localIp + ":" + props.doc.serverInfo.port + "/user?user=" + userText;
        const param = {"user": userText, "data":"nothing"};
        const response = await props.doc.requestGet(url, param);
        const user = response.data.return;

        setUserData(user);
        console.log(user);
        setUserId(user.USER_CODE);
    }

    const logIn = async (inputId = undefined) => {
        var userId;
        var prefix = "";
        var i;
        const prefixList = document.getElementsByName("idPrefix");
        if (inputId)
        {
            if (inputId.length <= 2)
                return;
            prefix = inputId.substring(0, 2);
            var found = false;
            for (i = 0 ; i < prefixList.length ; i++)
            {
                if (prefix === prefixList[i].id)
                {
                    found = true;
                    break;
                }
            }
            if (!found)
                return;
            userId = inputId;
        }
        else
        {
            const userValue = document.getElementById('userInput').value;
            for (i = 0 ; i < prefixList.length ; i++)
            {
                if (prefixList[i].checked)
                    prefix = prefixList[i].id
                    console.log("Pressed [" + i.toString() + " " + prefix + "]")

            }
            if (userValue[0] === "A" || userValue[0] === "a")
                userId = userValue;
            else
                userId = prefix + userValue;
        }
        console.log("LOGIN");
        console.log(userId);
        if (userId.length === 0)
            return;
        console.log("Set state to LoggingIn from " + state );
        setState(State.LoggingIn);
        const _id = userId.toUpperCase();
        getUserData(_id);
    }

    const logOut = async () => {
        console.log("Finish")
        setUserData({});
        setBookData({});
//        setBarcode("");
        setUserId("");
        setBookId("");
        setRented([])
        navigate("/")
    }

/*
    function getBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }
*/

    useEffect(() => {
        async function setBookValue() {
            if (bookValue.length <= 0)
                return;
            var _bookId;
            if (props.doc.admin)
                _bookId = bookValue;
            else
                _bookId = "HK" + bookValue;
            console.log("Search book1 " + _bookId);
            const url = "https://" + props.doc.serverInfo.localIp + ":" +
                props.doc.serverInfo.port + "/book";
//                const obj = {"params": {"book": btoa(toUtf8(_bookId)), "match": true}};
            const param = {"book": _bookId, "match": true};
            const response = await props.doc.requestGet(url, param);
            const book = response.data.return;
            console.log(book)
//                        if ('BOOKNAME' in book)
            if ('books' in book && 'BOOKNAME' in book.books)
            {
                console.log(book.books)
                setBookData(book.books)
            }
        }
        setBookValue()
    }, [bookValue, props.doc]);

    useEffect(() => {
        async function setBookId() {
            console.log("Set bookId: " + bookId);
            if (bookId.length === 0)
                return;
            console.log("Search book2 " + bookId);
            const url = "https://" + props.doc.serverInfo.localIp + ":" +
                props.doc.serverInfo.port + "/book";
//                const obj = {"params": {"book": btoa(toUtf8(bookId)), "match": true}};
            const param = {"book": bookId, "match": true};
            const response = await props.doc.requestGet(url, param);
            const book = response.data.return;
            console.log(book)
            if ('books' in book && 'BOOKNAME' in book.books)
            {
                setBookData(book.books)
            }
        }
        setBookId();
    }, [bookId, props.doc]);

    useEffect(() => {
        async function setUserId() {
            console.log("Set userId: " + userId);
            if (!userId || userId.length === 0)
                return;
            if (userId.search("AA") === 0 || userId.search("AB") === 0 )
            {
                const prefixList = document.getElementsByName("idPrefix");
                const prefix = userId.substring(0, 2);
                for (var i = 0 ; i < prefixList.length ; i++)
                {
                    const id = prefixList[i].id
                    if (prefix === id)
                        prefixList[i].checked = true
                    else
                        prefixList[i].checked = false

                }
            }
        }
    setUserId();
    }, [userId]);

    async function confirmAction()
    {
        console.log("Confirmed");
        setNeedConfirm(false);
        console.log(bookData);
        const url = "https://" + props.doc.serverInfo.localIp + ":" + props.doc.serverInfo.port + "/checkOut"
        const param = {
            book: bookData.BARCODE,
            user: userId
        };
        const response = await props.doc.requestPost(url, param);
        const ret = response.data.return
        console.log("Rent confirmed");
        console.log(ret)

        if (ret === "SUCCESS")
        {
            setNotifyRequest({"id": loadingId,
                              "text": props.text.rentSucceed,
                              "type": toast.TYPE.SUCCESS})
            rented.push({"id": bookData.BARCODE, "name": bookData.BOOKNAME})
            console.log(rented)
            setRented(rented)
        }
        else
        {
            let text
            if (ret in props.text)
                text = props.text[ret];
            else
                text = props.text.NOT_AVAILABLE;
            console.log(text)
            setNotifyRequest({"id": loadingId,
                              "text": text,
                              "type": toast.TYPE.ERROR})
        }
        setBookData({});
//        setBarcode("");
        setBookId("");
        getUserData(userId);
    }

    function showEntry(index, rent)
    {
    /*
        return (<React.Fragment key={index + "Fragment"}>
                    <tr key={index}>
                        <td className="bookCell"> {rent.id} </td>
                        <td colSpan="3" className="bookCell"> {rent.name} </td>
                    </tr>
                </React.Fragment>
                );
    */
        return (<div id="bookEntry" key={rent.id}>
                    <div id="bookItem"> {rent.id} </div>
                    <div id="bookItem"> {rent.name} </div>
                </div>);

    }

    function showBook(books)
    {
        return (<div id="bookList">
                    <div id="dueDate">
                    {props.text.dueDate} : {props.doc.dueDate}
                    </div>
                    {books.map((rent, index) => { return showEntry(index, rent) })}
                </div>);
    }
    /*
                    <table><tbody>
                        {books.map((rent, index) => { return showEntry(index, rent) })}
                    </tbody></table>
    */

    function cancelAction()
    {
        console.log("Cancelled")
        setNeedConfirm(false);
        setBookData({});
//        setBarcode("")
        setBookId("");
    }

    function setUserKeyDown(event)
    {
        if (event.key === "Enter")
        {
            console.log(event);
            console.log(document.getElementById('userInput').value);
            logIn();
        }
    }

//            <div id="checkOutResult" hidden={state !== State.LoggedIn ? true : false }>
//            <div id="checkOutResult" hidden={true}>
    return (
        <div id="checkOut">
            <div id="title">
                <h2>
                    {props.text.checkOut}
                </h2>
            </div>
            <div id="checkOutInput" hidden={state === State.LoggedIn}>
                <input type="radio" id = "AA" name="idPrefix"/>
                <label htmlFor="AA" className="idPrefix" name="idPrefix"> AA </label>
                <input type="radio" id = "AB" name="idPrefix"/>
                <label htmlFor="AB" className="idPrefix" name="idPrefix"> AB </label>
                <input type="text" id="userInput" pattern="[0-9]*" inputMode="numeric"
                    placeholder={props.text.idHolder}
                    onKeyDown={(event) => {
                        setUserKeyDown(event);
                    }}/>
               <button id="logIn" onClick={async () => logIn()}> {props.text.logIn} </button>
            </div>
            <div id="checkOutResult" hidden={state !== State.LoggedIn}>
                {userData.USER_CODE && (
                    <div id="userInfo">
                        <div id="userItem">
                            {userData.USER_CODE + " : " + userData.USER_NAME + props.text.nameSuffix}
                        </div>
                        <div id="userItem"> {getUserState(props.text, userData.USER_STATE)} </div>
                        <div id="userItem"> {userData._RENT.length + " " + props.text.rentSuffix} </div>
                    </div>
                )}
                <div id="bookInput" hidden={needConfirm}>
                    <label id="manualInput">
                        <div id="hkPrefix">
                        {props.text.numberOnly}
                        </div>
                        <input inputMode="numeric" pattern="[0-9]*" type="text" id="bookInput"
                            placeholder={props.text.bookHolder}
                            onInput={(event) => {
                                setBookText(event.target.value);
                            }} />
                    </label>
                </div>
                <div id="checkRent" hidden={!needConfirm}>
                    <div id="bookName"> {props.text.confirmRent} </div>
                    <div id="bookName"> {bookData.AUTHOR + ":"} </div>
                    <div id="bookName"> {bookData.BOOKNAME} </div>
                    <button id="confirm" onClick={async () => confirmAction()}> {props.text.confirm} </button>
                    <button id="cancel" onClick={() => cancelAction()}> {props.text.cancel} </button>
                </div>
                {rented.length > 0 &&
                    <ListView list={rented} showCallback={(entry) => {return showBook(entry)}}/>
                }
            </div>
            <button id="logOutButton" onClick={() => logOut()}> {props.text.finish} </button>
        </div>
    );
}

export default CheckOut;
