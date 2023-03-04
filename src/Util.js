export const SEARCH_PER_SCREEN = 10;
export const MAX_SEARCH_ENTRY = 500;

export const sleep = (time) => {
   return new Promise((resolve) => setTimeout(resolve, Math.ceil(time * 1000)));
};

interface String
{
    format: () => String;
}

// eslint-disable-next-line no-extend-native
String.prototype.format = function() {
    let formatted = this;
    for (let i = 0; i < arguments.length; i++) {
        let regexp = new RegExp('\\{'+i+'\\}', 'gi');
        formatted = formatted.replace(regexp, arguments[i]);
    }
    return formatted;
}

export const toastProp = {
    position: "top-center",
    autoClose: 3000,
    hideProgressBar: true,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined
}
