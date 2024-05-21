import { toast } from "react-toastify";
import axios from "axios";

class Doc {
    constructor() {
        console.log("Create Doc class");
        this.initialized = false;
        this.bookReady = false;
        this.rentReady = false;
        this.userReady = false;
        this.logged = false;
        this.userInfo = {};
        this.book = {};
        this.rent = {};
        this.logCallback = undefined;
        this.admin = false;
        this.dueDate = "";
        this.serverInfo = {};
        this.serverAvailable = false;
        this.ipAddr = ""
    }

    async requestGet(url, param)
    {
        param.os = navigator.platform;
        const obj = {"params": param};
        console.log("Request GET : " + url);
//        console.log(obj);
        const response = await axios.get(url, obj);
        return response;
    }

    async requestPost(url, param)
    {
        console.log("Request POST: " + url);
        param.os = navigator.platform;
//        console.log(param);
        const response = await axios.post(url, param);

        return response;
    }

    async updateIpAddr()
    {
        return;
//        const response = await axios.get("https://ipv4.seeip.org/jsonip");
/*
        const response = await axios.get("https://api.ipify.org/?format=json")
        console.log("Get IP Address");
        console.log(response.data);
        const ipAddr = response.data.ip;
        console.log("IP addr updated " + ipAddr)
        this.ipAddr = ipAddr;
        this.checkServerIp()
*/
    }

    checkServerIp()
    {
        return;
/*
        if (this.ipAddr.length === 0 || !this.serverInfo.globalIp)
            return;
        if (this.serverInfo.globalIp === this.ipAddr)
        {
            console.log("Server is accessible " + this.serverInfo.localIp);
            const query = "https://" + this.serverInfo.localIp + ":" + this.serverInfo.port + "/check";
            this.serverAvailable = true;
            axios.get(query, {"params": {"os": navigator.platform, }})
                .then( (response) => {
                    console.log("Server connected");
                    console.log(response.data);
                    this.admin = response.data.admin;
                    this.dueDate = response.data.dueDate;
                    this.initialized = true;
                })
                .catch(error => {
                  const query = "https://" + this.serverInfo.localIp + ":" + this.serverInfo.port + "/check";
                  window.open(query);
                });
        }
*/
    }


    checkState() {
        if (this.bookReady && this.rentReady) {
            this.initialized = true;
            toast.dismiss();
            if (this.callback) {
                this.callback();
            }
        }

    }

    setLogCallback(callback) {
        this.logCallback = callback;
    }

    setRent(rent) {
        this.rent = rent
        this.rentReady = true;
        this.checkState();
        this.checkRent();
    }

    setServerInfo(serverInfo)
    {
        console.log(serverInfo)
        this.serverInfo = serverInfo;
        this.serverInfo = {}
        this.serverInfo.globalIp = serverInfo.globalIp;

        if (serverInfo.proxy)
        {
            this.serverInfo.localIp = "libserver.hkmcclibrary.duckdns.org";
            this.serverInfo.port = 443;
        }
        else
        {
            this.serverInfo.localIp = serverInfo.localIp;
            this.serverInfo.port = serverInfo.port;
        }


        console.log(this.serverInfo);
        this.checkServerIp()
    }

    setBook(books) {
        this.book = {};
        for (let i = 0 ; i < books.length ; i++)
        {
            const book = books[i];
            const id = book['_id'];
            this.book[id] = {...book};
            this.book[id].claim = book.claim.replace(/_/g, " ");
        }
        this.bookReady = true;
        this.checkState();
    }

    setUser(users) {
        this.user = {};
        for (let i = 0 ; i < users.length ; i++)
        {
            const user = users[i];
            const id = user.id;
            this.user[id] = user;
            this.user[id]["rent"] = 0;
        }
        this.userReady = true;
        this.checkRent();
    }

    checkRent() {
        if (!this.userReady || !this.rentReady)
        {
            console.log("Cannot check rent");
            return;
        }
//        console.log(this.rent);
        for (let i = 0 ; i < this.rent.length ; i++)
        {
            const state = this.rent[i].state;

//            console.log(state);
            if (state !== "1" && state !== "3" && state !== 1 && state !== 3)
                continue;

            const userId = this.rent[i].user_id;
//            console.log(this.rent[i]);
//           console.log(userId);
//           console.log(userId.length);
            if (userId && userId.length > 0 && userId in this.user)
            {
                if ("rent" in this.user[userId])
                    this.user[userId]["rent"] += 1;
                else
                    this.user[userId]["rent"] = 1;
            }
            else
            {
                console.log("Invalid user")
                console.log(this.rent[i])
            }
        }
//        console.log(this.user);
    }

    logIn(userInfo) {
        console.log("Logged in: " + userInfo['_id']);
        this.logged = true;
        this.userInfo = userInfo;
        if (userInfo['level'] === "2" ||
            userInfo['level'] === 2)
            this.admin = true;
        if (this.logCallback)
            this.logCallback(true);
    }

    logOut() {
        console.log("Logged out");
        this.logged = false;
        this.userInfo = {};
        if (this.logCallback)
            this.logCallback(false);
    }

    async getRent(userId = undefined) {
        let ret = [];
        if (this.serverAvailable) {
            const url = "https://" + this.serverInfo.localIp + ":" +
                this.serverInfo.port + "/book";
            const param = {"user": userId};
            const result = await this.requestGet(url, param);
            console.log(result);
            if ("books" in result.data.return)
            {
                // BARCODE, BOOKNAME, LENT_DATE, RETURN_DATE, STATS
                // id, title, rentDate, retData,  stat
                for (const entry of result.data.return.books)
                {
                    console.log(entry);
                    const book = {
                        'id': entry.BARCODE,
                        'title': entry.BOOKNAME,
                        'claim': entry.CLAIM,
                        'claim_num': entry.CLAMENUM,
                        'totalName': entry.TOTAL_NAME,
                        'rentDate': entry.LENT_DATE,
                        'retDate': entry.RETURN_DATE,
                        'stat': entry.STATS,
                        'extendCount': entry._EXTEND_COUNT
                    };
                    ret.push(book);
                }
//                ret = result.data.return.books;
            }
        }
        else {
            console.log("Check " + userId);
            console.log(this.bookReady);
            if (!this.bookReady)
                return ret;
    //        console.log(this.rent.length);
            for (let i = 0 ; i < this.rent.length ; i++) {
                const entry = this.rent[i];
                if (userId !== undefined && entry.user_id !== userId)
                    continue;
    //            console.log(entry)
                if (entry.state !== "1" && entry.state !== "3" && entry.state !== 1 && entry.state !== 3)
                    continue;
    //            console.log(entry);
                const id = entry["book_id"];
                const book = this.book[id];
//                console.log(book)
                let retEntry = {}
                retEntry["id"] = book._id
                retEntry["title"] = book.title
                retEntry['claim_num'] = book.claim_num
                retEntry['totalName'] = book.series
                retEntry["rentDate"] = entry.rent_date.split(" ")[0].replace("-","/",2).replace("-", "/")
                retEntry["retDate"] = entry.return_date.split(" ")[0].replace("-","/",2).replace("-", "/")
                retEntry["claim"] = book.claim
                retEntry["user"] = entry.user_id;
                ret.push(retEntry)
            }
        }
        return ret;
    }

    getUser() {
        return this.user;
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

    setCallback(updateFunc)
    {
        console.log("Update function registered");
        this.callback = updateFunc;
    }
}

export default Doc;

