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

const doc = new Doc();
const textString = {};
function App() {
//    const [checkOutStr, setCheckOutStr] = useState("");
//    const [searchStr, setSearchStr] = useState("");

    useEffect(function () {
        async function initialize() {
            console.log("Initialize app");
            console.log(process.env.REACT_APP_NAME);
            console.log(process.env.REACT_APP_VERSION);

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
            toast.loading(textString.loading, prop);

            const docState = await doc.openDoc();

            console.log(docState);
            if (docState === false)
            {
                toast.dismiss();
                const prop = toastProp;
                prop.autoClose = 3000;
                toast.error(textString.failedToOpen, prop);
            }
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
