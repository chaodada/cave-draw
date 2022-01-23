let CaveDraw = (function () {
    const isMobile = /mobile/i.test(window.navigator.userAgent);
    const Util = {
        isMobile: isMobile,
        pixelRatio: window.devicePixelRatio,
        nameMap: {
            dragStart: isMobile ? 'touchstart' : 'mousedown',
            dragMove: isMobile ? 'touchmove' : 'mousemove',
            dragEnd: isMobile ? 'touchend' : 'mouseup',
        },
        domLoad(f) {
            document.addEventListener("DOMContentLoaded", f);
        },
        find(el, selector) {
            return el.querySelector(selector)
        },
        insertAfter(targetElement, newElement) {
            var parent = targetElement.parentNode;
            if (parent.lastChild == targetElement) {
                parent.appendChild(newElement);
            } else {
                parent.insertBefore(newElement, targetElement.nextElementSibling);
            }
        }
    }
    console.log(Util);
    /*
    ##########################################################
    # 全局变量
    ##########################################################
    */
    // 评论框元素
    let editorEle;
    // 是否有form元素
    let hasFormEle = false;
    // 是否是指定的评论系统
    let special = false;
    // 打开画板
    let open = false;
    // 打开画笔设置对话框
    let brushPop = false;
    // 画笔颜色
    let brushColor = "black";
    // 画笔粗细
    let brushLineWidth = 2 * Util.pixelRatio;
    // 橡皮擦
    let eraserEnabled = false;
    let eraserWidth = 20 * Util.pixelRatio;
    let eraserLineWidth = 5 * Util.pixelRatio;
    let eraserStrokeStyle = 'rgb(252,150,148)';
    // 画布最小高度(px)
    let minCanvasHeight = 300;
    /*
    ##########################################################
    # CaveDraw 闭包返回的函数
    ##########################################################
    */
    var f = function () {
        this.option = Array.prototype.shift.call(arguments);
        this.init();
    }
    f.prototype.init = function () {
        let root = this;
        // 对提交按钮的点击事件进行代理
        if (root.option.special && root.option.special == "valine") {
            special=true;
            root.submitProxy();
        }
        Util.domLoad(function () {
            editorEle = document.querySelector(root.option.ele);
            if (!editorEle) return;
            if (root.option.formEle && root.option.formEle != "") {
                hasFormEle = true;
            }
            root.getDom();
            root.UIEvent();
            root.draw();
            if (hasFormEle) {
                root.formEle = document.querySelector(root.option.formEle);
                root.send();
            }
        });
    }
    f.prototype.getDom = function () {
        let caveHtml = document.createElement('div');
        caveHtml.innerHTML = `
        <style>
        .clearfix::after {
            content: "";
            display: block;
            height: 0;
            visibility: hidden;
            clear: both;
        }

        .cd-container {
            position: relative;
            width: 100%;
            height: 34px;
            margin-top: 5px;
        }

        .cd-open {
            float: left;
            width: 80px;
            height: 30px;
            margin-top: 2px;
            font-size: 15px;
            color: white;
            background-color: #b37ba4;
            border-radius: 4px;
            border: none;
            cursor: pointer;
            transition: all .2s linear;
        }

        .cd-open:hover {
            background-color: #49d0c0;
        }

        .cd-toolbar {
            display: none;
            position: relative;
            float: right;
            height: 34px;
            border-radius: 3px;
            box-shadow: 0 1px 2px 0 rgba(32, 33, 36, 0.28);
            background: #fff;
        }

        .cd-toolbar button {
            width: 30px;
            height: 30px;
            margin: 2px 6px;
            border: none;
            background-size: 20px 20px;
            background-position: center center;
            background-repeat: no-repeat;
            background-color: #fff;
            cursor: pointer;
            border: 2px solid transparent;
            border-radius: 4px;
            transition: all .2s linear;
        }

        .cd-toolbar button.cd-brush {
            background-image: url('data:image/svg+xml;utf8,<svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="160" height="160"><path d="M273.6 957.056a25.6 25.6 0 0 1-18.112-7.488l-180.992-180.992a25.6 25.6 0 0 1 0-36.224L798.528 8.256a25.6 25.6 0 0 1 36.224 0l180.992 180.992a25.6 25.6 0 0 1 0 36.224L291.712 949.568a25.6 25.6 0 0 1-18.112 7.488z m-144.832-206.656l144.832 144.832L961.472 207.36 816.64 62.528 128.768 750.4z" p-id="2160"></path><path d="M26.304 1023.296a25.6 25.6 0 0 1-24.768-32.192l66.24-247.296a25.6 25.6 0 0 1 42.816-11.456l180.992 180.992a25.6 25.6 0 0 1-11.456 42.816L32.832 1022.4a26.048 26.048 0 0 1-6.656 0.896z m79.552-223.424l-43.328 161.6 161.6-43.264-118.272-118.336zM736.704 106.24l180.992 180.992-54.336 54.336-180.992-180.992 54.336-54.336zM332.416 653.824a25.6 25.6 0 0 1-18.112-43.712l271.552-271.488a25.6 25.6 0 0 1 36.224 36.224l-271.552 271.488a25.472 25.472 0 0 1-18.112 7.488z"></path></svg>');
        }

        .cd-toolbar button.cd-eraser {
            background-image: url('data:image/svg+xml;utf8,<svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="160" height="160"><path d="M978.817649 939.233112H522.995705l476.613823-476.613823c12.795002-12.795002 20.791878-33.58688 20.791878-55.978133s-7.996876-38.385006-20.791878-55.978134L673.336978 22.791097c-30.38813-30.38813-76.770012-30.38813-107.158142 0L84.766888 504.203046c-110.356892 110.356892-110.356892 294.285045 0 404.641936l30.38813 30.38813c55.978134 55.978134 127.95002 84.766888 204.720031 84.766888h662.141351c25.590004 0 43.183132-17.593128 43.183131-43.183132s-20.791878-41.583756-46.381882-41.583756z m-361.458805-847.668879l315.076923 315.076923-366.256931 366.256931-315.076923-315.076923L617.358844 91.564233zM143.943772 849.668098c-76.770012-76.770012-76.770012-204.720031 0-284.688793l46.381882-46.381882L507.001952 832.074971l-46.381882 46.381882c-38.385006 38.385006-89.565014 59.176884-140.745021 59.176884-55.978134 0-107.158141-20.791878-145.543147-59.176884L143.943772 849.668098z"></path></svg>');
        }

        .cd-toolbar button.cd-clear {
            background-image: url('data:image/svg+xml;utf8,<svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="160" height="160"><path d="M899.1 869.6l-53-305.6H864c14.4 0 26-11.6 26-26V346c0-14.4-11.6-26-26-26H618V138c0-14.4-11.6-26-26-26H432c-14.4 0-26 11.6-26 26v182H160c-14.4 0-26 11.6-26 26v192c0 14.4 11.6 26 26 26h17.9l-53 305.6c-0.3 1.5-0.4 3-0.4 4.4 0 14.4 11.6 26 26 26h723c1.5 0 3-0.1 4.4-0.4 14.2-2.4 23.7-15.9 21.2-30zM204 390h272V182h72v208h272v104H204V390z m468 440V674c0-4.4-3.6-8-8-8h-48c-4.4 0-8 3.6-8 8v156H416V674c0-4.4-3.6-8-8-8h-48c-4.4 0-8 3.6-8 8v156H202.8l45.1-260H776l45.1 260H672z"></path></svg>');
            background-size: 24px 24px;
        }

        .cd-toolbar button.cd-undo {
            background-image: url('data:image/svg+xml;utf8,<svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="160" height="160"><path d="M596.676923 248.123077c204.8 0 372.184615 165.415385 372.184615 372.184615s-167.384615 372.184615-372.184615 372.184616h-161.476923c-15.753846 0-25.6-11.815385-25.6-27.569231v-63.015385c0-15.753846 11.815385-29.538462 27.569231-29.538461h159.507692c139.815385 0 252.061538-112.246154 252.061539-252.061539s-112.246154-252.061538-252.061539-252.061538H322.953846s-15.753846 0-21.661538 1.969231c-15.753846 7.876923-11.815385 19.692308 1.96923 33.476923l96.492308 96.492307c11.815385 11.815385 9.846154 29.538462-1.969231 41.353847L354.461538 584.861538c-11.815385 11.815385-25.6 11.815385-37.415384 1.969231l-256-256c-9.846154-9.846154-9.846154-25.6 0-35.446154L315.076923 41.353846c11.815385-11.815385 31.507692-11.815385 41.353846 0l41.353846 41.353846c11.815385 11.815385 11.815385 31.507692 0 41.353846l-96.492307 96.492308c-11.815385 11.815385-11.815385 25.6 7.876923 25.6h13.784615l273.723077 1.969231z" fill="lightgray"></path></svg>');
        }

        .cd-toolbar button.cd-redo {
            background-image: url('data:image/svg+xml;utf8,<svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="160" height="160"><path d="M699.076923 246.153846h13.784615c19.692308 0 19.692308-13.784615 7.876924-25.6l-96.492308-96.492308c-11.815385-9.846154-11.815385-29.538462 0-41.353846l41.353846-41.353846c9.846154-11.815385 29.538462-11.815385 41.353846 0L960.984615 295.384615c9.846154 9.846154 9.846154 25.6 0 35.446154l-256 256c-11.815385 9.846154-25.6 9.846154-37.415384-1.969231l-43.323077-43.323076c-11.815385-11.815385-13.784615-29.538462-1.969231-41.353847l96.492308-96.492307c13.784615-13.784615 17.723077-25.6 1.969231-33.476923-5.907692-1.969231-21.661538-1.969231-21.661539-1.969231H425.353846c-139.815385 0-252.061538 112.246154-252.061538 252.061538s112.246154 252.061538 252.061538 252.061539h159.507692c15.753846 0 27.569231 13.784615 27.569231 29.538461V964.923077c0 15.753846-9.846154 27.569231-25.6 27.569231h-161.476923C220.553846 992.492308 53.169231 827.076923 53.169231 620.307692s167.384615-372.184615 372.184615-372.184615l273.723077-1.969231z" fill="lightgray"></path></svg>');
        }

        .cd-toolbar button.cd-undo.active {
            background-image: url('data:image/svg+xml;utf8,<svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="160" height="160"><path d="M596.676923 248.123077c204.8 0 372.184615 165.415385 372.184615 372.184615s-167.384615 372.184615-372.184615 372.184616h-161.476923c-15.753846 0-25.6-11.815385-25.6-27.569231v-63.015385c0-15.753846 11.815385-29.538462 27.569231-29.538461h159.507692c139.815385 0 252.061538-112.246154 252.061539-252.061539s-112.246154-252.061538-252.061539-252.061538H322.953846s-15.753846 0-21.661538 1.969231c-15.753846 7.876923-11.815385 19.692308 1.96923 33.476923l96.492308 96.492307c11.815385 11.815385 9.846154 29.538462-1.969231 41.353847L354.461538 584.861538c-11.815385 11.815385-25.6 11.815385-37.415384 1.969231l-256-256c-9.846154-9.846154-9.846154-25.6 0-35.446154L315.076923 41.353846c11.815385-11.815385 31.507692-11.815385 41.353846 0l41.353846 41.353846c11.815385 11.815385 11.815385 31.507692 0 41.353846l-96.492307 96.492308c-11.815385 11.815385-11.815385 25.6 7.876923 25.6h13.784615l273.723077 1.969231z"></path></svg>');
            border-color: transparent;
        }

        .cd-toolbar button.cd-redo.active {
            background-image: url('data:image/svg+xml;utf8,<svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="160" height="160"><path d="M699.076923 246.153846h13.784615c19.692308 0 19.692308-13.784615 7.876924-25.6l-96.492308-96.492308c-11.815385-9.846154-11.815385-29.538462 0-41.353846l41.353846-41.353846c9.846154-11.815385 29.538462-11.815385 41.353846 0L960.984615 295.384615c9.846154 9.846154 9.846154 25.6 0 35.446154l-256 256c-11.815385 9.846154-25.6 9.846154-37.415384-1.969231l-43.323077-43.323076c-11.815385-11.815385-13.784615-29.538462-1.969231-41.353847l96.492308-96.492307c13.784615-13.784615 17.723077-25.6 1.969231-33.476923-5.907692-1.969231-21.661538-1.969231-21.661539-1.969231H425.353846c-139.815385 0-252.061538 112.246154-252.061538 252.061538s112.246154 252.061538 252.061538 252.061539h159.507692c15.753846 0 27.569231 13.784615 27.569231 29.538461V964.923077c0 15.753846-9.846154 27.569231-25.6 27.569231h-161.476923C220.553846 992.492308 53.169231 827.076923 53.169231 620.307692s167.384615-372.184615 372.184615-372.184615l273.723077-1.969231z"></path></svg>');
            border-color: transparent;
        }

        .cd-toolbar button.cd-save {
            background-image: url('data:image/svg+xml;utf8,<svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="160" height="160"><path d="M829 856H195a4 4 0 0 0-4 4v64a4 4 0 0 0 4 4h634a4 4 0 0 0 4-4v-64a4 4 0 0 0-4-4z m22.2-376H676.6V112a16 16 0 0 0-16-16H363.4a16 16 0 0 0-16 16v368H172.8c-15 0-21.7 18.9-10.1 28.4l339.2 277.3a16 16 0 0 0 20.2 0l339.2-277.3c11.6-9.5 4.9-28.4-10.1-28.4zM512 701L329.8 552h89.6V168h185.2v384h89.6z"></path></svg>');
            background-size: 24px 24px;
        }

        .cd-toolbar button.active {
            border-color: #1398E6;
        }

        .cd-toolbar .brush-detail {
            display: none;
            position: absolute;
            box-sizing: content-box;
            top: -150px;
            left: 0;
            width: 226px;
            height: 108px;
            padding: 16px 16px;
            border: 1px solid #81A4BD;
            border-radius: 5px;
            color: #808FA2;
            font-style: 18px;
            background: #fff;
            font-size: 14px;
        }

        .brush-detail.active {
            display: block;
        }

        .brush-detail p {
            margin-top: 0px;
            margin-bottom: 4px !important;
        }

        .brush-detail .brush-color div {
            position: relative;
            float: left;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            cursor: pointer;
        }

        .brush-detail .brush-color div.active::before {
            position: absolute;
            box-sizing: border-box;
            left: 3px;
            top: 3px;
            content: '';
            display: block;
            width: 24px;
            height: 24px;
            background: transparent;
            border: 2px solid #fff;
            border-radius: 50%;
        }

        .brush-detail .brush-color div+div {
            margin-left: 8px;
        }

        .brush-detail .circle-box {
            position: relative;
            width: 24px;
            height: 24px;
            display: inline-block;
            text-align: center;
            margin-right: 8px;
            margin-left: 3px;
        }

        .brush-detail .circle-box .thickness {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 24px;
            height: 24px;
            margin-left: -12px;
            margin-top: -12px;
            background: #000;
            border-radius: 50%;
            /* transform-origin: center; */
        }

        .brush-detail input[type=range] {
            -webkit-appearance: none;
            width: 180px;
            height: 24px;
            outline: none !important;
            border: none !important;
            padding: 0 !important;
        }

        .brush-detail input[type='range']::-webkit-slider-runnable-track {
            background-color: #DBDBDB;
            height: 4px;
            border-radius: 5px;
        }

        .brush-detail input[type='range']::-webkit-slider-thumb {
            -webkit-appearance: none;
            /* border: 5px solid #fff; */
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #FF4081;
            cursor: pointer;
            margin-top: -4px;
        }

        #cave-canvas {
            display: none;
            margin-top: 10px;
        }

        @media screen and (max-width: 768px) {
            .cd-toolbar button {
                margin: 2px 3px;
            }

            .cd-toolbar .brush-detail {
                top: -134px;
                left: -8px;
                padding: 8px 8px;
            }
        }
        </style>
        ` + `
        <div class="cd-container clearfix">
            <button class="cd-open" id="cd-open" title="打开画板" type="button">打开画板</button>
            <div class="cd-toolbar" id="cd-toolbar">
                <button class="cd-brush active" id="cd-brush" title="画笔" type="button"></button>
                <div class="brush-detail" id="brushDetail">
                    <p>画笔大小</p>
                    <div class="">
                        <span class="circle-box"><i class="thickness" id="thickness"></i></span>
                        <input type="range" id="brushLineWidthRange" min="1" max="20" value="6">
                    </div>
                    <p>画笔颜色</p>
                    <div class="brush-color clearfix">
                        <div class="brush-color-item active" style="background-color: black;"></div>
                        <div class="brush-color-item" style="background-color: #FF3333;"></div>
                        <div class="brush-color-item" style="background-color: #99CC00;"></div>
                        <div class="brush-color-item" style="background-color: #0066FF;"></div>
                        <div class="brush-color-item" style="background-color: #FFFF33;"></div>
                        <div class="brush-color-item" style="background-color: #33CC66;"></div>
                    </div>
                </div>
                <button class="cd-eraser" id="cd-eraser" title="橡皮擦" type="button"></button>
                <button class="cd-clear" id="cd-clear" title="清屏" type="button"></button>
                <button class="cd-undo"  id="cd-undo" title="撤销" type="button"></button>
                <button class="cd-redo"  id="cd-redo" title="再做" type="button"></button>
                <button class="cd-save"  id="cd-save" title="保存" type="button"></button>
            </div>
        </div>
        <canvas id="cave-canvas">
            <div>
                <a href="https://github.com/flatblowfish/cave-draw" target="_blank">Cave Draw</a> Powered by <a href="https://blog.maplesugar.top" target="_blank">枫糖</a>
                <h3>如果您看到这段文字，说明您的浏览器不支持Canvas。</h3>
            </div>
        </canvas>
        ` + `<style>.cd-open{` + this.option.openBtn.style + `}.cd-open:hover{` + this.option.openBtn.hoverStyle + `}</style>`;
        Util.insertAfter(editorEle, caveHtml);
        // 打开画板
        this.openBtn = document.getElementById('cd-open');
        // 画布
        this.canvasEle = document.getElementById('cave-canvas');
        this.context = this.canvasEle.getContext('2d');
        // 画笔 toolBar
        this.toolBarEle = document.getElementById('cd-toolbar');
        this.brushBtn = document.getElementById('cd-brush');
        this.eraserBtn = document.getElementById('cd-eraser');
        this.clearBtn = document.getElementById("cd-clear");
        this.undoBtn = document.getElementById("cd-undo");
        this.redoBtn = document.getElementById("cd-redo");
        this.saveBtn = document.getElementById("cd-save");
        // 画笔设置对话框
        this.brushDetail = document.getElementById("brushDetail");
        this.brushLineWidthRange = document.getElementById('brushLineWidthRange');
        this.thickness = document.getElementById("thickness");
        this.brushColorEle = document.getElementsByClassName("brush-color-item");
    }
    f.prototype.UIEvent = function () {
        let root = this;
        let updateBtn = function () {
            if (eraserEnabled) {
                root.brushBtn.classList.remove('active');
                root.eraserBtn.classList.add('active');
            } else {
                root.brushBtn.classList.add('active');
                root.eraserBtn.classList.remove('active');
            }
            if (brushPop) {
                root.brushDetail.classList.add('active');
            } else {
                root.brushDetail.classList.remove('active');
            }
        }
        // 打开画板
        this.openBtn.addEventListener("click", function () {
            if (open) {
                root.toolBarEle.style.display = "none";
                root.canvasEle.style.display = "none";
            } else {
                root.toolBarEle.style.display = "block";
                root.canvasEle.style.display = "block";
            }
            open = !open;
        });
        this.brushBtn.addEventListener("click", function () {
            console.log("brushBtn click");
            eraserEnabled = false;
            brushPop = !brushPop;
            updateBtn();
        });
        // 点击其他地方，画笔对话框关闭
        // 必须绑定到document上面，body可能不满一屏
        let brushPopClose = function (e) {
            if (!brushPop) return;
            var cDom = root.brushDetail;
            var tDom = e.target;
            if (tDom == root.brushBtn) return;
            // contians函数，相等也会返回
            if (!cDom.contains(tDom)) {
                console.log("document click");
                brushPop = !brushPop;
                updateBtn();
            }
        }
        document.addEventListener(Util.nameMap.dragStart, brushPopClose);
        // 画笔粗细
        let changeBrushLineWidth = function () {
            // 通过设置大小改变圆圈大小。使用flex布局，使得圆圈水平垂直居中，不好定位，放弃。
            // thickness.style.width = (parseInt(brushLineWidthRange.value)) * 2 + "px";
            // thickness.style.height = (parseInt(brushLineWidthRange.value)) * 2 + "px";
            root.thickness.style.transform = 'scale(' + (root.brushLineWidthRange.value / 20) + ')';
            brushLineWidth = parseInt(root.brushLineWidthRange.value) * Util.pixelRatio;
        }
        changeBrushLineWidth();
        this.brushLineWidthRange.addEventListener("input", changeBrushLineWidth);
        // 画笔颜色
        let changeColor = (function () {
            for (let i = 0; i < root.brushColorEle.length; i++) {
                root.brushColorEle[i].addEventListener("click", function (e) {
                    for (let i = 0; i < root.brushColorEle.length; i++) {
                        root.brushColorEle[i].classList.remove("active");
                    }
                    this.classList.add("active");
                    brushColor = this.style.backgroundColor;
                    root.context.fillStyle = brushColor;
                    root.context.strokeStyle = brushColor;
                    root.thickness.style.background = brushColor;
                })
            }
        })()
        // 点击橡皮檫
        this.eraserBtn.addEventListener("click", function () {
            eraserEnabled = true;
            updateBtn();
        })
    }
    f.prototype.draw = function () {
        let root = this;
        // canvas 样式
        root.canvasEle.style = root.option.canvasStyle;
        let initCanvas = function () {
            // 设置线条末端样式。
            root.context.lineCap = "round";
            // 设定线条与线条间接合处的样式
            root.context.lineJoin = "round";
        }
        /*
        ##########################################################
        # canvas resize
        ##########################################################
        */
        let canvasResize = function () {
            console.log("canvasResize");
            let imgData = root.context.getImageData(0, 0, root.canvasEle.width, root.canvasEle.height);
            let pageWidth = editorEle.offsetWidth;
            let pageHeight = editorEle.offsetWidth / 3 < minCanvasHeight ? minCanvasHeight : editorEle.offsetWidth / 3;
            // canvas 实际大小
            root.canvasEle.width = pageWidth * Util.pixelRatio;
            root.canvasEle.height = pageHeight * Util.pixelRatio;
            root.context.putImageData(imgData, 0, 0);
            // root.canvasEle.width = pageWidth ;
            // root.canvasEle.height = pageHeight ;
            // css 控制 canvas 显示大小
            root.canvasEle.style.width = pageWidth + "px";;
            root.canvasEle.style.height = pageHeight + "px";;
            // 需要再次设置 canvas 样式
            initCanvas();
        }
        canvasResize();
        window.addEventListener('resize', canvasResize);
        // 监听 editorEle resize事件
        // 用来处理情况：页面开始加载后没有滚动条，valine 等评论系统从后台拉取数据后，插入到评论dom中，页面开始有了滚动条，造成 editorEle 减小，需要重新计算 canvas 的大小。
        new ResizeObserver(function (entries) {
            canvasResize();
        }).observe(editorEle);
        /*
        ##########################################################
        # canvas 画图
        ##########################################################
        */
        // 获取鼠标在画布上的位置
        var getPoint = function (e) {
            if (Util.isMobile) {
                return {
                    'x': (e.touches[0].clientX - root.canvasEle.getBoundingClientRect().left) * Util.pixelRatio,
                    'y': (e.touches[0].clientY - root.canvasEle.getBoundingClientRect().top) * Util.pixelRatio
                };
            } else {
                return {
                    'x': e.offsetX * Util.pixelRatio,
                    'y': e.offsetY * Util.pixelRatio
                };
            }
        }
        // 擦除原理：保存画图，剪辑区域，恢复画图
        function erasePoint(x, y) {
            root.context.save();
            root.context.beginPath();
            // 注意擦除半径，把绘制的圆形橡皮擦也擦掉了，实际测试需要 +1 ，否则橡皮图像会留下一圈
            root.context.arc(x, y, eraserWidth / 2 + 1, 0, Math.PI * 2);
            root.context.clip();
            // context.clip()指定了剪辑区域，下面的清空效果只会在剪辑区域里发生
            root.context.clearRect(0, 0, root.canvasEle.width, root.canvasEle.height)
            root.context.restore();
        }
        // 显示圆形橡皮擦
        function drawEraser(x, y) {
            root.context.save();
            // 实际测试 lineWidth 绘制在了圆点内部
            root.context.lineWidth = eraserLineWidth;
            root.context.strokeStyle = eraserStrokeStyle;
            root.context.beginPath();
            root.context.arc(x, y, eraserWidth / 2, 0, Math.PI * 2);
            root.context.clip();
            root.context.stroke();
            root.context.restore();
        }

        function drawLine(x1, y1, x2, y2) {
            root.context.beginPath();
            root.context.lineWidth = brushLineWidth;
            root.context.strokeStyle = brushColor;
            root.context.moveTo(x1, y1);
            root.context.lineTo(x2, y2);
            root.context.stroke();
            root.context.closePath();
        }

        function onDownDraw(point) {
            if (eraserEnabled) {
                // 鼠标第一次点下的时候擦除一个圆形区域
                erasePoint(point.x, point.y);
            } else {
                // 鼠标第一次点下的时候，绘制一个点
                drawLine(point.x, point.y, point.x, point.y);
            }
        }

        function onMoveDraw(lastPoint, newPoint) {
            if (eraserEnabled) {
                erasePoint(lastPoint.x, lastPoint.y); //擦除lastX、lastY所记录位置的图形
                drawEraser(newPoint.x, newPoint.y); //画橡皮擦图形
                //记录最后坐标
            } else {
                drawLine(lastPoint.x, lastPoint.y, newPoint.x, newPoint.y);
            }
        }

        function onUpDraw(point) {
            if (eraserEnabled) {
                // 最后需要清除绘制的橡皮图像
                erasePoint(point.x, point.y);
            }
        }
        // 画板事件
        let canvasEleEvent = (function () {
            // 定义一个变量初始化画笔状态
            var painting = false;
            // 记录画笔最后一次的位置
            var lastPoint = {
                x: undefined,
                y: undefined
            };
            var newPoint = {
                'x': undefined,
                'y': undefined
            };
            // 鼠标按下事件
            root.canvasEle.addEventListener(Util.nameMap.dragStart, function (e) {
                console.log("onmousedown");
                e.preventDefault();
                painting = true;
                lastPoint = getPoint(e);
                onDownDraw(lastPoint);
            });
            // 鼠标移动事件
            root.canvasEle.addEventListener(Util.nameMap.dragMove, function (e) {
                console.log("onmousemove");
                e.preventDefault();
                if (!painting) return;
                newPoint = getPoint(e);
                onMoveDraw(lastPoint, newPoint);
                lastPoint = newPoint;
            });

            // 鼠标松开事件
            root.canvasEle.addEventListener(Util.nameMap.dragEnd, function (e) {
                console.log("onmouseup");
                e.preventDefault();
                painting = false;
                onUpDraw(lastPoint);
                drawDone();
            })
        })();
        /*
        ##########################################################
        # canvas undo redo
        # 1. step 追踪当前画图
        # 2. undo 画图后，又绘制了新图，就形成了一条新的画图链，需要清除 canvasHistory 中保存的后续画图。
        ##########################################################
        */
        // 保存每次画图的链接
        root.canvasHistory = [];
        // 当前 canvasHistory 中的指针
        let step = 0;
        let saveCanvas = function (callback) {
            if (hasFormEle||special) {
                root.canvasEle.toBlob(function (blob) {
                    let blobUrl = URL.createObjectURL(blob);
                    root.canvasHistory.push(blobUrl);
                    if (callback) callback();
                }, "image/png", 1)
            } else {
                let baseUrl = root.canvasEle.toDataURL("image/png");
                root.canvasHistory.push(baseUrl);
                if (callback) callback();
            }
        }
        let resetHistory = function (callback) {
            root.canvasHistory = [];
            // 当前 canvasHistory 中的指针
            step = 0;
            // 初始化时，推入第一个空白画图
            saveCanvas(callback);
        }
        resetHistory();
        // 更新 undo redo 按钮状态，通过 step canvasHistory 两个变量
        // undo redo 过程中 canvasHistory 没有改变
        // drawDone clearBtn 过程中，canvasHistory 都有一个 root.canvasEle.toBlob(function) 的回调，需要在完 toBlob 后，再更新状态
        let updateUndoRedoBtnStatus = function () {
            if (step > 0) {
                root.undoBtn.classList.add('active');
            } else {
                root.undoBtn.classList.remove('active');
            }
            if (step < root.canvasHistory.length - 1) {
                root.redoBtn.classList.add('active');
            } else {
                root.redoBtn.classList.remove('active');
            }
        }
        // 清屏
        this.clearBtn.addEventListener("click", function () {
            root.context.clearRect(0, 0, root.canvasEle.width, root.canvasEle.height);
            resetHistory(function () {
                updateEditor(root.canvasHistory[step])
                updateUndoRedoBtnStatus();
            });
        })
        // 绘图完毕/undo 完毕/redo 完毕后，更新 editor 中的内容
        let updateEditor = function (url) {
            let imgDom = `<img id="cave-img" alt="画板图片，请勿删除" src="${url}" />`;
            let reg = /\<img id="cave-img".*\>/g;
            if (reg.test(editorEle.value)) {
                editorEle.value = editorEle.value.replace(reg, imgDom);
            } else if (editorEle.value == "") {
                editorEle.value = imgDom;
            } else {
                editorEle.value = editorEle.value + '\n' + imgDom;
            }
            if (!Util.isMobile) editorEle.focus();
        }
        // 每次画图完毕，保存画图到 canvasHistory
        let drawDone = function () {
            // undo 画图后，又绘制了新图，就形成了一条新的画图链，需要清除 canvasHistory 中保存的后续画图。
            if (step < root.canvasHistory.length - 1) {
                root.canvasHistory.length = step + 1;
            }
            step++;
            // 添加新的画图到历史记录
            saveCanvas(function () {
                updateEditor(root.canvasHistory[step])
                updateUndoRedoBtnStatus();
            });
        }
        // 撤销
        let canvasUndo = function () {
            console.log("canvasUndo");
            if (step > 0) {
                step--;
                let canvasPic = new Image();
                canvasPic.onload = function () {
                    // 先清空画布，再绘制图片
                    root.context.clearRect(0, 0, root.canvasEle.width, root.canvasEle.height);
                    root.context.drawImage(canvasPic, 0, 0);
                    updateEditor(canvasPic.src);
                }
                canvasPic.src = root.canvasHistory[step];
            }
            updateUndoRedoBtnStatus();
        }
        // 重做
        let canvasRedo = function () {
            console.log("canvasRedo");
            if (step < root.canvasHistory.length - 1) {
                step++;
                let canvasPic = new Image();
                canvasPic.onload = function () {
                    root.context.clearRect(0, 0, root.canvasEle.width, root.canvasEle.height);
                    root.context.drawImage(canvasPic, 0, 0);
                    updateEditor(canvasPic.src);
                }
                canvasPic.src = root.canvasHistory[step];
            }
            updateUndoRedoBtnStatus();
        }
        // 事件
        this.undoBtn.addEventListener("click", function () {
            canvasUndo();
        })
        this.redoBtn.addEventListener("click", function () {
            canvasRedo();
        })
        /*
        ##########################################################
        # canvas 下载图片
        ##########################################################
        */
        this.saveBtn.addEventListener("click", function () {
            let imgUrl = root.canvasEle.toDataURL('image/png');
            let saveA = document.createElement('a');
            document.body.appendChild(saveA);
            saveA.href = imgUrl;
            saveA.download = 'cave-draw' + "-" + (new Date).getTime();
            saveA.target = '_blank';
            saveA.click();
        })
    }
    f.prototype.send = function () {
        let root = this;
        this.formEle.addEventListener("submit", function (e) {
            let baseUrl = root.canvasEle.toDataURL("image/png");
            let imgDom = '<img id="cave-img" src="' + baseUrl + '" />';
            let reg = /\<img id="cave-img".*\>/g;
            editorEle.value = editorEle.value.replace(reg, imgDom);
        });
    }
    /*
    ##########################################################
    # 拦截valine提交按钮，在执行submit按钮click事件前，[对文本框内容进行替换]
    # 1. valine对文本框内容的过滤在文本框失去焦点就开始了，所以在正确执行[对文本框内容进行替换]之前，文本框内容就被过滤干净了，然后valine直接发送自己已经过滤的内容到服务器。
    # 2. 在点击提交按钮之前，先[对文本框内容进行替换]，再对本框失去焦点，触发valine过滤文本框内容
    ##########################################################
    */
    f.prototype.submitProxy = function () {
        let root = this;
        Element.prototype._addEventListener = Element.prototype.addEventListener;
        Element.prototype.addEventListener = function(a,b,c) {
            if(c==undefined)
            c=false;
            var d=b;
            // console.log(a);
            // console.log(this);
            // 匹配到valine的submit按钮click事件
            if(this===document.querySelector(".vsubmit")&&a==="click"){
                d = function(){
                    // console.log(a);
                    // console.log(this);
                    let baseUrl = root.canvasEle.toDataURL("image/png");
                    let imgDom = '<img id="cave-img" src="' + baseUrl + '" />';
                    let reg = /\<img id="cave-img".*\>/g;
                    editorEle.value = editorEle.value.replace(reg, imgDom);
                    console.log(editorEle.value);
                    editorEle.focus();
                    editorEle.blur();
                    b();
                }
            }
            this._addEventListener(a,d,c);
        }
    }
    return f;
})();
