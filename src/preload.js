const{ contextBridge,ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ipcRenderer', {
    invoke: (channel, data) => {
        // const whiteList =["menu:contextmenu","dialog:messageBox"];
        // if(!whiteList.includes(channel)) {
        //     throw new Error(`Invalid channel ${channel}`);
        // }
        return ipcRenderer.invoke(channel, data);
    },
    send: (channel, data) => {
        // const whiteList =["menu:contextmenu","dialog:errorBox"];
        // if(!whiteList.includes(channel)) {
        //     throw new Error(`Invalid channel ${channel}`);
        // }
        ipcRenderer.send(channel, data);
    }
})