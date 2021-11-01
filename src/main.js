const os = require('os');
const fs = require('fs');
const path = require('path');
const hx = require('hbuilderx');
const JSONC = require('json-comments');

const Html = require('./html.js');

/**
 * @description 打开视图
 * @param {Object} projectInfo 项目管理器选中的项目信息
 */
function showView(param) {

    // 获取项目信息，并读取manifest.json
    let projectData = getProjectInfo(param);

    // 创建webviewDialog, 并设置对话框基本属性，包括标题、按钮等
    let webviewDialog = hx.window.createWebViewDialog({
        modal: true,
        title: "发布Android App",
        description: "发布Android App到各大应用市场、或内测平台",
        dialogButtons: ["开始提交", "关闭"],
        size: { width: 700, height: 600 }
    }, {
        enableScripts: true
    });

    // 用于渲染对话框主要内容
    let webview = webviewDialog.webView;
    webview.html = Html(projectData);

    webview.onDidReceiveMessage((msg) => {
        let action = msg.command;
        switch (action) {
            case 'closed':
                // 关闭对话框
                webviewDialog.close();
                break;
            case 'submitApp':
                let data = msg.data;
                // 设置对话框指定按钮状态
                webviewDialog.setButtonStatus("开始提交", ["loading", "disable"]);
                submitApp(data, webviewDialog, webview);
                break;
            case 'uploadImg':
                let imgType = msg.data;
                selectImg(imgType, webviewDialog, webview);
                break;
            default:
                break;
        };
    });

    // 显示对话框，返回显示成功或者失败的信息，主要包含内置浏览器相关状态。
    let promi = webviewDialog.show();
    promi.then(function (data) {
        console.log(data)
    });
};


/**
 * @description 提交应用
 * @param {Object} appInfo
 * @param {Object} webviewDialog
 * @param {Object} webview
 */
function submitApp(appInfo, webviewDialog, webview) {
    let {icon,versionName,versionCode,description,changelog } = appInfo;
    if (!icon || !versionName || !versionCode || !description || !changelog) {

        webviewDialog.setButtonStatus("开始提交", []);

        // 在对话框副标题下方显示红色错误信息，错误信息会由动态抖动效果
        let emsg = '所有信息必填，不能为空';
        webviewDialog.displayError(emsg);

        return;
    } else {
        webviewDialog.close();
        hx.window.showInformationMessage("感谢体验插件API webviewDialog示例。", ["关闭"])
    }
};


/**
 * @description 获取项目信息，并读取manifest.json
 * @param {Object} projectInfo
 */
function getProjectInfo(projectInfo) {
    let data = {};

    data.projectName = projectInfo.workspaceFolder.name;
    data.projectType = projectInfo.workspaceFolder.nature;
    data.projectPath = projectInfo.workspaceFolder.uri.fsPath;
    let manifestFilePath = path.join(data.projectPath, "manifest.json");

    if ( ["App",'UniApp_Vue',"Wap2App"].includes(data.projectType) && fs.existsSync(manifestFilePath)) {
        let manifest = fs.readFileSync(manifestFilePath, 'utf-8');
        try{
            let { name, description, versionName, versionCode, appid } = JSONC.parse(manifest);
            data.name = name;
            data.description = description;
            data.versionName = versionName;
            data.versionCode = versionCode;
            data.appid = appid;
        }catch(e){}
    };
    return data;
};


/**
 * @description 选择图片
 * @param {Object} webviewDialog
 * @param {Object} webview
 */
function selectImg(imgType, webviewDialog, webview) {
    let files = hx.request("window.showFileDialog",{
        title:'请选择需要上传的图片',
        filter:"Images (*.png *.xpm *.jpg)",
        supportMulti:false
    })
    files.then(selections => {
        if (selections.length) {
            webview.postMessage({
                "command": "img",
                "imgType": imgType,
                "data": selections[0]
            })
        }
    });
};

module.exports = showView;
