import React, { useEffect, useState } from "react";
import "./App.css";

import Home from "./pages/Home";
import Notice from "./pages/Notice";
import Search from "./pages/Search";
import CheckOutStatus from "./pages/CheckOutStatus";
import CheckOut from "./pages/CheckOut";
import Return from "./pages/Return";
import UserSearch from "./pages/UserSearch";
import RentalSituation from "./pages/RentalSituation";
import RentHistory from "./pages/RentHistory";
import NewMember from "./pages/NewMember";
//import Reader from "./pages/Reader";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Zoom } from "react-toastify";
import { HashRouter as Router, Routes, Route} from "react-router-dom";
import Doc from "./Doc";
import Context from "./Context";
import text from "./api/text";
import { toast } from "react-toastify";
import { toastProp, loadingId } from "./Util";
import { useQuery, useLazyQuery } from "@apollo/client";
import Navbar from "./Navbar";
import {SERVER_QUERY} from "./api/query.js";
import {BOOK_QUERY, RENT_QUERY, USER_QUERY} from "./api/query.js";
//import {BOOK_QUERY, RENT_QUERY, USER_QUERY} from "./api/query_test.js";

const doc = new Doc();
const context = new Context();

const textString = {};
let logMsg = ""
function App() {

//    const [checkOutStr, setCheckOutStr] = useState("");
    const [initialized, setInitialized] = useState(false);
    const [logged, setLogged] = useState(false);
    const [userId, setUserId] = useState("");
    const { loading: rentLoading, error: rentError, data: rentData } = useQuery(RENT_QUERY);
    const { loading: serverLoading, error: serverError, data: serverData } = useQuery(SERVER_QUERY);
    const [loadBook, { loading: bookLoading, error: bookError, data: bookData }] = useLazyQuery(BOOK_QUERY);
    const [loadUser, { data: userData }] = useLazyQuery(USER_QUERY, { "variables": { "_id": userId } });

    useEffect(function () {
        async function initialize() {
            console.log("Initialize app");
            console.log("Platform: ");
            console.log(navigator.platform);
            logMsg = logMsg + "<p>Initialize app</p>";
            console.log(process.env.APP_NAME);
            console.log(process.env.APP_VERSION);
            const lang = navigator.languages;
            console.log(lang);
            let ts = {}
            if (lang.length> 0 && (lang[0].toLowerCase().includes("kr") || lang[0].toLowerCase().includes("ko")))
            {
                ts = text.kr;
            }
            else
            {
                ts = text.en;
            }
            for (let key in ts)
            {
                textString[key] = ts[key];
            }

            await doc.updateIpAddr();

            if ("autoLogin" in context.cookie &&  context.cookie.autoLogin === "true")
            {
                console.log("Auto Login: " + context.cookie.user_id);
                setUserId(context.cookie.user_id);
                console.log(context.cookie.nothing);
                loadUser();
            }
            setInitialized(true);
        }
        initialize();
    }, [loadUser]);

    useEffect(
        () => {
            console.log("User data loaded");
            if (!userData)
            {
                return;
            }

//            console.log("Login check " + context.cookie.password);
            const user = userData.user
//            const user = userData.user_test
//            console.log(user);
            if (context.cookie.password && context.checkLogIn(user, context.cookie.password))
            {
                console.log("Login suceeded");
                doc.logIn(user);
            }



        }, [userData]
    );
    useEffect(
        () => {
            console.log("Rent Query Updated");
            logMsg = logMsg + "<p>Rent Query Updated " + rentLoading + " " + rentError + "</p>";
            console.log(rentLoading);
            console.log("Rent Error");
            console.log(rentError);
            if (rentData)
            {
                console.log("Rent available");
                logMsg = logMsg + "<p>Rent available</p>"
//                console.log(rentData.rents)
                doc.setRent(rentData.rents)
//                doc.setRent(rentData.rent_tests)
                if (doc.initialized)
                    notifyInit()
            }
        }, [rentLoading, rentError, rentData]
    );

    useEffect(
        () => {
            console.log("Book Query Updated");
            logMsg = logMsg + "<p>Book Query Updated</p>";
            console.log(bookLoading)
            console.log(bookError)
            if (bookData)
            {
                console.log("Book available")
                logMsg = logMsg + "<p>Book available</p>";
//                console.log(bookData.books)
                doc.setBook(bookData.books)
//                doc.setBook(bookData.book_tests)
                if (doc.initialized)
                    notifyInit()
            }
        }, [bookLoading, bookError, bookData]
    );

    useEffect(
        () => {
            console.log("Server Query Updated");
            logMsg = logMsg + "<p>Server Query Updated</p>";

            console.log(serverData);
            console.log(initialized);
            if (!serverData || !initialized)
                return

            console.log("Server info available")
            logMsg = logMsg + "<p>Server info available</p>";
            console.log(serverData)
            doc.setServerInfo(serverData.serverInfo)

            if (!doc.serverAvailable)
            {
                console.log("Server is not available. Load books from cloud DB");
                loadBook();
                const prop = toastProp;
                prop.type = toast.TYPE.LOADING;
                prop.autoClose = false;
                prop.toastId = loadingId;
                toast.loading(textString.loading, prop);
                doc.setLogCallback(updateLog);
            }
        }, [serverLoading, serverError, serverData, loadBook, initialized]
    );

    function notifyInit()
    {
        const prop = toastProp;
        prop.type = toast.TYPE.SUCCESS;
        prop.render = textString.succeededToOpen;
        prop.autoClose = 3000;
        prop.toastId = "";
        toast.info(textString.succeededToOpen, prop);
    }

    function updateLog(logged) {
        console.log("==== Update logging state " + doc.logged);
//        console.log(doc.userInfo);
        setLogged(doc.logged);
    }

    return (
    <Router>
        <div className="App">
            <div>
                <ToastContainer
                    newestOnTop
                    closeOnClick
                    rtl={false}
                    draggable
                    pauseOnHover
                    pauseOnFocusLoss={false}
                    transition={Zoom}
                    limit={10}
                />
            </div>
            <Navbar doc={doc} text={textString}/>
            <Routes>
                <Route path="/" element={<Home doc={doc} text={textString}/>} />
                <Route path="/notice" element={<Notice doc={doc} text={textString} />} />
                <Route path="/search/:id?" element={<Search doc={doc} text={textString}/>} />
                <Route path="/checkOutStatus" element={<CheckOutStatus context={context} doc={doc} text={textString} logged={logged}/>} />
                <Route path="/userSearch/:id?" element={<UserSearch context={context} doc={doc} text={textString} />} />
                <Route path="/checkOut/:id?" element={<CheckOut context={context} doc={doc} text={textString}/>} />
                <Route path="/return" element={<Return context={context} doc={doc} text={textString}/>} />
                <Route path="/rentalSituation" element={<RentalSituation context={context} doc={doc} text={textString}/>} />
                <Route path="/rentHistory" element={<RentHistory context={context} doc={doc} text={textString}/>} />
                <Route path="/newMember" element={<NewMember context={context} doc={doc} text={textString}/>} />
            </Routes>

            <h3>
                v {process.env.REACT_APP_VERSION}
            </h3>
        </div>
    </Router>
    );
}

export default App;
