import React, { useEffect } from "react";
import "./App.css";
import Search from "./pages/Search";
import CheckOut from "./pages/CheckOut";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Zoom } from "react-toastify";
import { HashRouter as Router, Routes, Route} from "react-router-dom";
import Doc from "./Doc";
import text from "./api/text";
import { toast } from "react-toastify";
import { toastProp } from "./Util";
import { useQuery } from "@apollo/client";
import gql from "graphql-tag";

const BOOK_QUERY = gql`
    query AllBook{
        books (limit:20000) {
            _id
            author
            title
            category
            claim
            publisher
            seqnum
        }
    }
`;

const RENT_QUERY = gql`
    query AllRent{
        rents (limit:20000) {
            _id
            book_id
            rent_date
            return_date
            state
        }
    }
`;


const doc = new Doc();
const textString = {};
function App() {
//    const [checkOutStr, setCheckOutStr] = useState("");
//    const [searchStr, setSearchStr] = useState("");
    const { loading: rentLoading, error: rentError, data: rentData } = useQuery(RENT_QUERY);
    const { loading: bookLoading, error: bookError, data: bookData } = useQuery(BOOK_QUERY);
    useEffect(
        () => {
            console.log("Rent Query Updated")
            console.log(rentLoading)
            console.log(rentError)
            if (rentData)
            {
                console.log("Data available")
                console.log(rentData.rents)
                doc.setRent(rentData.rents)
            }
        }, [rentLoading, rentError, rentData]
    );

    useEffect(
        () => {
            console.log("Book Query Updated")
            console.log(bookLoading)
            console.log(bookError)
            if (bookData)
            {
                console.log("Book available")
                console.log(bookData.books)
                doc.setBook(bookData.books)
            }
        }, [bookLoading, bookError, bookData]
    );

    useEffect(function () {
        async function initialize() {
            console.log("Initialize app");
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
            console.log(textString);
            const prop = toastProp;
            prop.type = toast.TYPE.LOADING;
            prop.autoClose = false;
            toast.info(textString.loading, prop);
/*
            const docState = await doc.openDoc();
            console.log(docState);
            if (docState === false)
            {
                const prop = toastProp;
                prop.autoClose = 3000;
                toast.error(textString.failedToOpen, prop);
            }
*/
        }
        initialize();
    }, []);

/*
            <div>
                <nav id="nav">
                    <table id="nav"><tbody>
                    <tr>
                        <td id="nav_item">
                            <Link to="/checkout"><button id="nav_checkOut">{checkOutStr}</button></Link>
                        </td>
                        <td id="nav_item">
                            <Link to="/"><button id="nav_search">{searchStr}</button></Link>
                        </td>
                    </tr>
                    </tbody></table>
                </nav>
            </div>

            <hr />
            */
    return (
        <Router>

            <div className="App">
                <Routes>
                    <Route path="/" element={<Search doc={doc} text={textString}/>} />
                    <Route path="/checkOutHidden" element={<CheckOut doc={doc} text={textString}/>} />
                </Routes>

                <div>
                <ToastContainer
                    newestOnTop
                    closeOnClick
                    rtl={false}
                    draggable
                    pauseOnHover
                    pauseOnFocusLoss={false}
                    transition={Zoom}
                />
                </div>
                <h2>
                    v {process.env.REACT_APP_VERSION}
                </h2>
            </div>
        </Router>
    );
}

export default App;
