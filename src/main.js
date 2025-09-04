const {app, BrowserWindow,ipcMain,nativeTheme, Menu ,Tray ,nativeImage, Notification,globalShortcut} = require('electron');
const path = require('path');

 let mainWindow = null;
 const icon = nativeImage.createFromPath("src/assets/icon.png")

//创建窗口
function createWindow() {
    // 创建浏览器窗口实例，设置窗口大小和偏好配置
        mainWindow = new BrowserWindow({
        width: 800,    // 设置窗口宽度为800像素
        height: 600,   // 设置窗口高度为600像素
        webPreferences: {
            nodeIntegration: true,  // 启用Node.js集成，使渲染进程可以访问Node.js API
            preload: path.join(__dirname, 'preload.js')  // 设置预加载脚本路径，用于在渲染进程加载前执行
        }
    });
    // 加载应用的主HTML页面
    mainWindow.loadFile('./src/html/index.html');
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



