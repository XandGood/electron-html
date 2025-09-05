const {app, BrowserWindow,ipcMain,nativeTheme, Menu ,Tray ,nativeImage, Notification,globalShortcut, dialog} = require('electron');
const path = require('path');
const fs = require('fs');

 let mainWindow = null;
 let loadingWindow = null;
 const icon = nativeImage.createFromPath("src/assets/icon.png")
 const iconOffline = nativeImage.createFromPath("src/assets/icon-offline.png")

//创建窗口公共方法
function createWindowCommon(url, options={}) {
    const defaultOptions = {
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js')
        }
   }
   options = Object.assign(defaultOptions, options);
   const win = new BrowserWindow(options);
   win.loadFile(path.join(__dirname, url));
   return win;
}
//创建加载窗口
function createLoadingWindow() {
    // 创建加载窗口实例，设置窗口大小和偏好配置
    const options = {
        width: 350,    
        height: 250,   
        frame: false,  
    };
    loadingWindow=createWindowCommon('/html/loading.html',options);
}
//创建窗口
function createWindow() {
        const options ={
        show: false,  
    };
    // 加载应用的主HTML页面
    mainWindow= createWindowCommon('/html/index.html',options);
    mainWindow.on('close', (event) =>{
        event.preventDefault();
        mainWindow.hide();
    })
    // 监听窗口关闭事件，将mainWindow设置为null
    mainWindow.on('closed', () => {
        mainWindow = null;
    })
}

//创建菜单
function createMenu() {
    const template =[
        {
            label: '设置',
            submenu: [
                { label: "退出" ,
                    click: () => {
                        mainWindow.destroy();
                        app.quit();
                    }
                },
                {
                    label: '切换主题',
                    submenu:[
                        {label: '深色模式', type: "radio",checked: nativeTheme.shouldUseDarkColors,
                            click: () => {
                                nativeTheme.themeSource = 'dark';
                            }
                        },
                        {label: '浅色模式', type: "radio",checked: !nativeTheme.shouldUseDarkColors,
                            click: () => {
                                nativeTheme.themeSource = 'light';
                            }
                        }
                    ]
                }
            ]
        },
        {
            label: '帮助',
            submenu:[
                {label: '关于'},
                {label: '检查更新'},
                {type: 'separator'},
                {label: '问题反馈'}
            ]
        }
    ];
    //此处应该分别不同系统下创建菜单
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

//创建托盘
function createTray() {
    const template = [
        {label: '打开主窗口',
         click: () => {
            mainWindow.show();
        }
        },
        {type: 'separator'},
        {label: '退出', 
            click: () => {
                mainWindow.destroy();
                app.quit();
            }
        }
    ];
    const menu = Menu.buildFromTemplate(template);
    const tray = new Tray(icon);
    tray.setToolTip("简介：仓库管理系统");
    tray.setTitle("仓库管理系统")
    tray.setContextMenu(menu);
}
//切换托盘图标
function flashTray() {
    let flag = true;
    setInterval(() => {
        if(flag){
            tray.setImage(iconOffline);
        }else{
            tray.setImage(icon);
        }
        flag = !flag;
    }, 1000)
    //图表闪烁
    // setInterval(() => {
    //     if(flag){
    //         tray.setImage(flag? icon : nativeImage.createEmpty);
    //     }
    //     flag = !flag;
    // }, 1000)
}

// 检查更新
function updateCheck() {
    const options = {
        icon: icon,
        title: '温馨提示',
        body: '有新版本可用，是否更新？'
    }
    const notify = new Notification(options)
    notify.on('click', () => {
        console.log('通知被点击了')
    })
    notify.show();
}

//注册快捷键
function registerShortcut() {
    globalShortcut.register('CommandOrControl+Shift+i', () => { 
        mainWindow.webContents.openDevTools()
    })  
}

//启动应用
app.on('ready', () => {
    createLoadingWindow();
    createTray();
    createMenu();
    registerShortcut();
    createWindow();
    // updateCheck();

    app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
})
})
//关闭应用
app.on('window-all-closed', () => {
    globalShortcut.unregisterAll();
    if (process.platform !== 'darwin') {
        app.quit();
    }
})
//右键菜单
ipcMain.on("menu:contextmenu",(event,template)=>{
    template = template || [];
    const options=[
        ...template,
        {label:"刷新"},
        {label:"退出"}
    ];
    const menu = Menu.buildFromTemplate(options);
    const win = BrowserWindow.fromWebContents(event.sender);
    menu.popup(win);
})
//消息弹窗
ipcMain.handle('dialog:messageBox', async (event, options) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    return dialog.showMessageBox(win, options);
})
//错误提示
// ipcMain.on('dialog:errorBox', async (event, options) => {
//     const win = BrowserWindow.fromWebContents(event.sender);
//     return dialog.showErrorBox(win, options);
// })



//文件处理
ipcMain.handle('dialog:openFile', async (event, options) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    return dialog.showOpenDialog(win, options);
})
ipcMain.handle('dialog:saveFile', async (event, options) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    return dialog.showSaveDialog(win, options);
})
ipcMain.handle('fs:readFile', async (event, filePath) => {
    return await fs.promises.readFile(filePath, 'utf-8');
})
ipcMain.handle('fs:writeFile', async (event, { filePath, data }) => {
    return await fs.promises.writeFile(filePath,data, 'utf-8');
})
//网络状态
ipcMain.on("network:status", (event, status) => {
    tray.setImage(status? icon : iconOffline);
})
//加载完成
ipcMain.on("loading:done", (event) => {
    loadingWindow.close();
    mainWindow.show();
})

ipcMain.on("window:open", (event,settings) => {
    const parentWindow = BrowserWindow.fromWebContents(event.sender);
    const {url , options} = settings;
    options.parent = parentWindow;
    const win = createWindowCommon(url, options);
})



