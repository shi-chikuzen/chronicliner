// Copyright (c) 2022 @shi_chikuzen
Vue.use(Vuetify);

Vue.config.devtools = true;

const vuetify = new Vuetify({
    theme: {
        themes: {
            light: {
                primary: '#00aeb9',
                success: '#00aeb9',
            },
        },
    },
});

var app = new Vue({
    el: '#app',
    vuetify: new Vuetify(),
    data: {
        primaryColor: '#00aeb9',
        primaryColorAlpha: "rgba(0, 174, 185, 0.2)",
        fileSelected: null,
        workbook: null,
        state: { "fileError": false, "ready": false, "loading": false, domUpdated: false, "message": [], "errorSnack": false, highlightMode: false, showDisplaySetting: true, showYearRangeSummary: false, showCharacterDB: false},
        displaySetting: {
            showAccordion: true,
            yearRange: {"min": 1900, "max": 2000, "value": [1900, 2000]},
        },
        defaults: {
            "color": ["#47cacc", "#63bcc9", "#cdb3d4", "#e7b7c8", "#ffbe88"],
            "sheetNames": { "category": "カテゴリー", "character": "キャラクター", "school": "教育課程", "event": "イベント", "periodEvent": "期間イベント" },
            "colNames": {
                "category": { "name": "カテゴリ名", "color": "カテゴリ色", "bgcolor": "カテゴリ色" },
                "character": { "name": "キャラクタ名", "category": "カテゴリ", "birthday": "誕生日", "death": "死亡日", "birthdayDetail": "誕生日詳細", "deathdayDetail": "死亡日詳細", "autoBirth": "誕生年自動計算", "tag": "タグ" },
                "school": { "characterName": "キャラクタ名", "name": "教育課程名", "period": "基準所属年数", "startDate": "起算日", "age": "開始年齢", "enterGrade": "編入学年", "enterDate": "編入日", "autoBirth": "誕生年自動計算に使用", "autoYear": "誕生年起算年", "autoGrade": "誕生年起算学年" },
                "event": { "category": "カテゴリ", "title": "タイトル", "date": "日時", "limit": "以下を無視", "beforeAfter": "以前 / 以降", "detail": "詳細", "tag": "タグ", "important": "重要イベント" },
                "periodEvent": { "category": "カテゴリ", "title": "タイトル", "startDate": "開始日時", "endDate": "終了日時", "limit": "以下を無視", "display": "経過時間粒度", "startDetail": "開始時詳細", "endDetail": "終了時詳細", "tag": "タグ", "important": "重要イベント" },
            },
            "displayLimit": { "month": 0, "day": 1, "hour": 2, "minute": 3, "second": 4 },
            "displayTime": { "year": "年", "month": "ヶ月", "day": "日", "hour": "時間", "minute": "分", "second": "秒" },
            "beforeAfter": { "以前": 0, "": 1, "期間": 1, "以降": 2 },
            "backgroundColor": "rgb(247, 248, 247)",
            "borderColor": "rgb(229, 229, 229)",
            "summaryBackgroundColor": "#DADADA",
            "characterDatabase": {"dtype": "データ型", "index": "項目名", "value": "値"},
        },
        data: { "settings": { "category": {}, "character": {}, "school": {}, }, "event": {}, "periodEvent": {"events": {}, "markers": []}, "characters": [], "tags": {"character": [], "event": [], "master": []} },
        characterSelected: [],
        tagBulkMode: false,
        tagSelected: {"character": [], "event": [], "master": []},
        eventKeys: [],
        timelineHeaders: [],
        timelineData: [],
        yearSummary: {},
        yearRangeSummary: {"head": {}, "tail":{}},
        tableHeight: 0,
        characterDatabaseWorkbook: null,
        characterDatabase: {
            width: 500,
            mainTab: null,
            dataTab: null,
            compareTab: null,
            fileSelected: null,
            characterListSelected: null,
            columnListSelected: null,
            imgSelected: null,
            characterList: [],
            columnList: [],
            characterHeader: [
                { text: "データ型", value:"dtype"},
                { text: "項目名", value: "index", sortable: true, groupable: false,},
                { text: "値", value: "value", sortable: true, groupable: false, }
            ],
            timelineHeader: [
                { text: "日付", value: "date"},
                { text: "カテゴリ", value: "category" },
                { text: "タイトル", value: "title" }
            ],
            compareHeader: [
                { text: "キャラクター", value: "character" },
                { text: "値", value:"value"}
            ],
            state: { ready: false, fileError: false },
            characters: {},
            template: {"img": [], "date": {}, "data": {}, "chart": {}, "group": "登録グループなし", "color": {}, "caption": ""},
            columns: { "color":[], "date": [], "data":[], "chart":[], },
            data: {},
            chart: null,
            compareChart: null,
            chartOptions: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false,
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        pointLabels: {
                            font: {
                                size: 14
                            }
                        }
                    }
                }
            },
            chartData: {},
            compareChartData: {},
            chartWidth: 0,
            crossTabValue: [null, null, null]
        }
    },
    computed: {
        snackMessage: function () {
            return this.state.message.join("<br>");
        },
        colsTL: function () {
            return this.data.characters.map(name => name + "_tl");
        },
        colsEV: function () {
            return this.data.characters.map(name => name + "_ev");
        },
        currentEventTagMode: function () {
            return ((this.tagBulkMode) ? 'master' : 'event')
        },
        showAccordionSwicherLabel: function () {
            return ((this.displaySetting.showAccordion)? "アコーディオン表示　" : "アコーディオン非表示")
        },
        numRows: function () {
            return this.timelineData.filter((row) => row.show).length;
        },
        // ###############################
        // Character Database
        // ###############################
        currentCharacter: function () {
            const selectedRow = this.characterDatabase.characterList[this.characterDatabase.characterListSelected];
            if (selectedRow === undefined) return this.characterDatabase.template;
            return this.characterDatabase.data[selectedRow.name];
        },
        currentColumnName: function () {
            const selectedColumn = this.characterDatabase.columnList[this.characterDatabase.columnListSelected];
            if (selectedColumn === undefined) return "";
            return selectedColumn.colName;
        },
        currentColumnDtype: function () {
            const selectedColumn = this.characterDatabase.columnList[this.characterDatabase.columnListSelected];
            if (selectedColumn === undefined) return "";
            return selectedColumn.dtype;
        },
        characterDatabaseCompareItems: function () {
            const selectedColumn = this.characterDatabase.columnList[this.characterDatabase.columnListSelected];
            if (selectedColumn === undefined) return [];

            const colName = selectedColumn.colName;
            const dtype = selectedColumn.dtype;
            const data = this.characterDatabase.data;
            let res = [];

            for (let [characterName, dtypeObj] of Object.entries(data)) {
                const df = dtypeObj[dtype];
                if (Object.keys(df).indexOf(colName) == -1) continue;
                res.push({ "character": characterName, "value": df[colName], "dtype": dtype });
            }
            return res;
        },
        characterDatabaseItems: function () {
            const selectedRow = this.characterDatabase.characterList[this.characterDatabase.characterListSelected]
            if (selectedRow === undefined) return [];

            let res = [];
            const characterName = selectedRow.name;
            const data = this.characterDatabase.data[characterName];
            const dtypes = Object.keys(this.characterDatabase.columns);
            for (const dtype of dtypes) {
                const df = data[dtype];
                if (df.length == 0) continue;

                for (let [k, v] of Object.entries(df)) {
                    let displayLimit = this.defaults.displayLimit["hour"];
                    if (dtype == "date") {
                        if (v.getHours() != 0) displayLimit = this.defaults.displayLimit["minute"];
                        if (v.getMinutes() != 0) displayLimit = this.defaults.displayLimit["second"];
                    }
                    res.push({ "index": k, "value": v, "dtype": dtype, "displayLimit": displayLimit });
                }
            }
            return res;
        },
        characterDatabaseImages: function () {
            const selectedRow = this.characterDatabase.characterList[this.characterDatabase.characterListSelected]
            if (selectedRow === undefined) return [];

            const characterName = selectedRow.name;
            const data = this.characterDatabase.data[characterName];
            return data.img;
        },
        characterDatabaseTimelineItems: function () {
            const selectedRow = this.characterDatabase.characterList[this.characterDatabase.characterListSelected]
            if (selectedRow === undefined) return [];

            const characterName = selectedRow.name;
            if (this.data.characters.indexOf(characterName) == -1) return [];

            let res = [];
            this.timelineData.forEach((row) => {
                if (
                    !row.summary &&
                    (row.characters.indexOf(characterName) != -1)
                ) {
                    const events = row[`${characterName}_ev`];
                    for (const event of events) {
                        const item = {
                            date: row.date,
                            displayLimit: row.displayLimit,
                            category: (event.category == characterName) ? "キャラクター" : ((event.category == "all")? "共通":event.category),
                            title: event.title,
                        };
                        res.push(item);
                    }
                }
            });

            return res;
        },
        compareTabBtnMsg: function () {
            return (this.characterDatabase.compareTab == 0) ? "レーダー表示" : "クロス集計表示";
        },
        crossTabItems: function () {
            let res = [[], [], []];
            columns_all = []
            for (let [dtype, columns] of Object.entries(this.characterDatabase.columns)) {
                columns_all = columns_all.concat(columns);
            }
            res[0] = _.cloneDeep(columns_all);
            if (this.characterDatabase.crossTabValue[0] === null) return res;
            res[1] = _.cloneDeep(columns_all);
            res[1] = res[1].filter((elem) => elem != this.characterDatabase.crossTabValue[0]);
            if (this.characterDatabase.crossTabValue[1] === null) return res;
            res[2] = _.cloneDeep(columns_all);
            res[2] = res[2].filter((elem) => elem != this.characterDatabase.crossTabValue[0] && elem != this.characterDatabase.crossTabValue[1]);
            return res;
        },
        crossTabHeader: function () {
            if (this.characterDatabase.crossTabValue[0] === null) return [];
            let res = [{ text: "キャラクター", value: "character", groupable: false }];
            for (const [index, colName] of this.characterDatabase.crossTabValue.entries()) {
                if (colName === null) return res;
                const column = this.characterDatabase.columnList.filter((columns) => columns.colName == colName)[0];
                res.push({ text: colName, dtype: column.dtype, value: colName, groupable: (index == 0) });
            }
            return res;
        },
        crossTabTableItem: function () {
            if (this.crossTabHeader.length < 2) return [];
            let res = [];
            const columns = this.crossTabHeader.slice(1);
            const data = this.characterDatabase.data;
            for (let [characterName, dtypeObj] of Object.entries(data)) {
                let row = {"character": characterName};
                let tmpVal = null;
                columns.forEach((column) => {
                    let value = dtypeObj[column.dtype][column.value];
                    value = (value === undefined) ? null : value;
                    if (column.dtype == "date") value = this.strftime(value);
                    row[column.value] = value;
                    tmpVal = (value === null)? tmpVal : value;
                });
                if (tmpVal !== null) {
                    res.push(row);
                }
            }
            return res;
        }
    },
    mounted: function () {
        this.defaults.data = JSON.parse(JSON.stringify(this.data));
        this.setCharacterDatabaseWidth();
        window.addEventListener("resize", this.windowResized);
        this.$nextTick(function () {
            this.characterDatabase.chartWidth = ((
                this.characterDatabase.width - 48
            ) / 12 * 5) - 24;
            this.setTableHeight();
            this.replaceDisplaySettingSnackbar();
            this.state.showDisplaySetting = false;
        });
    },
    beforeDestroy: function () {
        window.removeEventListener("resize", this.windowResized);
    },
    watch: {
        workbook: 'init',
        characterDatabaseWorkbook: "initCharacterDatabase",
        characterSelected: 'update',
        tagBulkMode: 'changeTagBulkMode',
        "state.showCharacterDB": 'undisplayDisplaySetting',
    },
    methods: {
        // Utils
        getObjectKey(obj, val) { // dictをvalで逆引きする
            const key = Object.keys(obj).filter(key => {
                return obj[key] === val;
            })
            return key;
        },
        zip(array1, array2) { // Python zip
            let result = [...Array(array1.length)];
            result.forEach(function (elem, index) {
                result[index] = [array1[index], array2[index]];
            });
            return result;
        },
        union(array1, array2) { // 配列の和集合を返す
            const x = new Set(array1);
            const y = new Set(array2);
            return Array.from(new Set([...x, ...y]));
        },
        intersection(array1, array2) { // 配列の積集合を返す
            const x = new Set(array1);
            const y = new Set(array2);
            return Array.from(new Set([...x].filter(e => (y.has(e)))));
        },
        range(start, end) { // Python range
            const result = [...Array((end - start) + 1)].map((_, i) => start + i);
            return result;
        },
        convertSerial2Date(serial) { // エクセルのシリアル値をDateに変換する
            const coef = 24 * 60 * 60 * 1000;
            const offset = 70 * 365 + 17 + 1 + 1;
            const diff = 9 * 60 * 60 * 1000;
            const unixtime = (serial - offset) * coef - diff;
            let result = new Date(unixtime);
            if (result.getSeconds() > 0) {
                result.setSeconds(result.getSeconds() + 1);
                result.setMilliseconds(0);
            };
            return result;
        },
        fillTimeByZero(val) { // 時刻をゼロ埋めする
            return ("0" + String(val)).slice(-2);
        },
        isBetween(target, start, end) { // targetがstart以上end未満かを返す
            return (target >= start) && (target < end);
        },
        isWithin(target, start, end) { // targetがstart以上end以下かを返す
            return (target >= start) && (target <= end);
        },
        isinSchoolPeriod(target, start, end) { // targetがstart<target<=endかを返す
            return (target > start) && (target <= end);
        },
        formatDate(input) { // 日付っぽいものをDate形式に変換する
            const type = Object.prototype.toString.call(input);
            if (type == "[object Date]") {
                return input;
            } else if (typeof (input) == "string") {
                const splitted = input.split("/");
                if (splitted.length == 2) return new Date(1900, Number(splitted[0]) - 1, Number(splitted[1]));
                return new Date(Date.parse(input));
            } else {
                return this.convertSerial2Date(input);
            };
        },
        resetDateFromLimit(date, limit) { // 指定された閾値以下の時間単位をリセットする
            const settings = this.defaults.displayLimit;
            if (limit in settings) {
                if (settings[limit] <= 0) date.setMonth(0);
                if (settings[limit] <= 1) date.setDate(1);
                if (settings[limit] <= 2) date.setHours(0);
                if (settings[limit] <= 3) date.setMinutes(0);
            };
            return date;
        },
        isInvalidDate(date) { // 無効な日付かどうかをチェック
            return Number.isNaN(date.getDate());
        },
        formatTag(tagStr) {
            return (tagStr == "") ? [] : tagStr.replace(/\s+/g, "").split("#").filter(t => t != "");
        },
        isSameDate(date1, date2) {
            return (date1.getDate() == date2.getDate()) && (date1.getMonth() == date2.getMonth());
        },
        getRowIndex(row) {
            const rowDisplayed = this.timelineData.filter((row) => row.show);
            return rowDisplayed.indexOf(row);
        },
        strftime(date, displayLimit = 2) {
            if (displayLimit == 0) return String(date.getFullYear());
            if (displayLimit == 1) return `${date.getFullYear()}/${date.getMonth() + 1}`;
            if (displayLimit == 2) return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
            if (displayLimit == 3) return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:00`;
            if (displayLimit == 4) return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes()}`;
            return date.toLocaleDateString();
        },
        // File
        readFile: function (file) { // xlsx読み込み
            this.state.loading = true;
            const vm = this;
            const reader = new FileReader();
            reader.onload = function (e) {
                let data = e.target.result;
                vm.workbook = XLSX.read(data, { 'type': 'binary' })
            };
            reader.readAsBinaryString(file);
        },
        validData() { // 必要なシート・列がファイルに存在するかを返す
            this.state.message = [];
            const sheetNames = Object.values(this.defaults.sheetNames);
            let valid = true;
            for (let i = 0; i < sheetNames.length; i++) {
                if (this.workbook.SheetNames.indexOf(sheetNames[i]) == -1) {
                    this.state.message.push(`以下のシートが存在しません: ${sheetNames[i]}`);
                    valid = false;
                } else {
                    const data = XLSX.utils.sheet_to_json(this.workbook.Sheets[sheetNames[i]], { header: 1 });
                    const key = this.getObjectKey(this.defaults.sheetNames, sheetNames[i]);
                    const colNames = Object.values(this.defaults.colNames[key]);
                    for (let j = 0; j < colNames.length; j++) {
                        if (data[0].indexOf(colNames[j]) == -1) {
                            this.state.message.push(`${sheetNames[i]}シートに以下の列が存在しません: ${colNames[j]}`);
                            valid = false;
                        };
                    };
                };
            };
            this.state.fileError = !valid;
            return valid;
        },
        // Get Info
        getBirth(character, school) { // 誕生年を計算してDate形式で返す
            let birthday = character.birthday;
            const startDate = school.startDate;
            const age = school.age;
            const autoYear = school.autoYear;
            const autoGrade = school.autoGrade;
            // 1年目の期間を設定
            const firstYearStart = new Date(autoYear - autoGrade + 1, startDate.getMonth(), startDate.getDate());
            const firstYearEnd = new Date(autoYear - autoGrade + 2, startDate.getMonth(), startDate.getDate());
            // birthdayを指定教育課程1年目の期間内になるように設定
            birthday.setFullYear(firstYearStart.getFullYear());
            if (!this.isinSchoolPeriod(birthday, firstYearStart, firstYearEnd)) {
                birthday.setFullYear(birthday.getFullYear() + 1);
            };
            // 指定教育課程の開始年齢を減算
            birthday.setFullYear(birthday.getFullYear() - age);
            // 結果を返却
            return birthday;
        },
        getCharacterSchoolInfo(name, date) { // 指定キャラクターの該当Dateの教育課程情報を返す
            const character = this.data.settings.character[name];
            if (!(character.school === null)) {
                const schools = character.school;
                for (let index = 0; index < schools.length; index++) {
                    const school = schools[index];
                    if (this.isBetween(date, school.enter, school.end)) {
                        const grade = Math.floor((date.getTime() - school.start.getTime()) / (365 * 24 * 60 * 60 * 1000)) + 1;
                        return { "name": school.name, "grade": grade };
                    };
                };
            };
            return {};
        },
        getYearPassed(start, end) { // 経過年数（切り捨て）を返す
            const years = Math.floor((end.getTime() - start.getTime()) / (365 * 24 * 60 * 60 * 1000));
            return years;
        },
        getAgeSerial(name, date) { // 該当dateでの年齢をシリアル値で返す
            if (date === undefined) return -1;
            const character = this.data.settings.character[name];
            const passed = this.resetDateFromLimit(date, "hour").getTime() - this.resetDateFromLimit(character.birthday, "hour").getTime();
            return passed;
        },
        getCharacterPeriodEvents(name, date) { // 指定キャラクターの該当DateのperiodEventを返す
            const events = this.data.periodEvent.events[name];
            return events.filter(event => this.isWithin(date, event.startDate, event.endDate));
        },
        getPeriodEventDiff(periodEvent, date) { // periodEventのstartからの経過時間を返す
            const fromDate = moment(periodEvent.startDate);
            const toDate = moment(date);
            const diff = Math.round(toDate.diff(fromDate, `${periodEvent.display}s`, true), 2);
            return String(diff) + this.defaults.displayTime[periodEvent.display] + "目";
        },
        isCharacterSelected(character) { // 該当キャラクターが選択されているかを返す
            return this.characterSelected.indexOf(character) != -1;
        },
        isCharacterDied(character, date) { // 該当日に該当キャラクターが死んでいるかを返す
            return !this.isWithin(date, date, character.death);
        },
        isFirstYearAfterDied(row, data) { // キャラクター死亡後の初表示行かを返す
            // default val of default row
            const flagFirstAfterDied = data.firstAfterDied;
            if (flagFirstAfterDied) return true;

            const character = this.data.settings.character[data.name];
            if (character.death === null) return false;

            // 表示制限時の先頭行
            const isHead = Object.is(row, this.yearRangeSummary.head);
            if (isHead) return false;

            // 表示制限時の最終行
            const isTail = Object.is(row, this.yearRangeSummary.tail);
            if (isTail) {
                const rowDisplayed = this.timelineData.filter((row) => row.show);
                const prevRowDisplayed = rowDisplayed.slice(-2)[0];
                const isAliveInPrevRow = (this.getAgeSerial(data.name, prevRowDisplayed.date) > 0) && !this.isCharacterDied(character, prevRowDisplayed.date);
                const isDiedNow = this.isCharacterDied(character, row.date);
                return isAliveInPrevRow && isDiedNow;
            };

            return false;
        },
        returnCardColor(category) { // カードの色を返却
            if (category == "all") {
                return '';
            } else if (category == "summary") {
                return this.defaults.summaryBackgroundColor;
            } else if (category in this.data.settings.category) {
                return this.data.settings.category[category].color;
            } else {
                return this.defaults.backgroundColor;
            };
        },
        returnCardTextClass(event) { // カードの表示モードを返却
            let classes = [];
            if (event.category in this.data.settings.category) { classes.push("white--text") }
            if (this.state.highlightMode & !event.important & !(event.category in this.data.settings.category)) { classes.push("text-disabled") }
            return classes.join(" ");
        },
        returnCardIconColor(event) { // カードのアイコンに適用する色を返却
            if (event.category in this.data.settings.category) {
                return 'white';
            } else {
                return '';
            };
        },
        returnTagTextStyle(category) { // タグテキスト色用cssを返却
            if (category in this.data.settings.category) {
                return '';
            } else {
                return 'color: #BDBDBD !important;';
            };
        },
        returnCardClass(index, events, event) { // rowにあるカードの数に応じてマージン設定クラスを返す
            let tags = [];
            const numEvents = events.length;
            if (numEvents == 0 || index == numEvents - 1) {
                tags.push("my-2");
            } else {
                tags.push("mb-4 mt-2");
            };
            if (!event.important & this.state.highlightMode & event.category in this.data.settings.category) { tags.push("border-none") }
            return tags.join(' ');
        },
        returnTdClass(item, column) { // tdに付与するクラスを返却
            const cellClass = _.cloneDeep(column.cellClass);
            const colName = column.value;
            if (this.colsTL.indexOf(colName) == -1) {
                if (item.isFirstEvent) cellClass.push("timeline-year-border");
                if (!item.isFirstEvent) cellClass.push("border-none");
            };
            return cellClass.join(' ');
        },
        returnTimelineColorStyle(item, column) { // タイムライン列の背景色を返却
            const data = item[column.value];
            const passed = this.getAgeSerial(data.name, item.date);
            if (passed < 0 || data.died == true) return `background-color: ${this.defaults.backgroundColor};`;
            return `background-color: ${data.color};`;
        },
        displayNofillArrow(row, data) {
            const isHead = Object.is(row, this.yearRangeSummary.head);
            if (isHead) return false;
            const isTail = Object.is(row, this.yearRangeSummary.tail);
            if (isTail) {
                const character = this.data.settings.character[data.name];
                const isBornBetweenDisplayRange = this.isBetween(character.birthday.getFullYear(), this.displaySetting.yearRange.value[1], this.displaySetting.yearRange.max);
                if (isBornBetweenDisplayRange) return false;
                const isBornBetweenHideRange = character.birthday.year >= this.displaySetting.yearRange.value[1] + 1;
                if (isBornBetweenHideRange) return true;
            };
            const timePassed = this.getAgeSerial(data.name, row.date);
            return timePassed > 0;
        },
        // Create Base Data
        createCategory() { // カテゴリ設定を読み込んでフォーマット
            const data = XLSX.utils.sheet_to_json(this.workbook.Sheets[this.defaults.sheetNames["category"]], { header: 0 });
            const colNames = this.defaults.colNames["category"];
            for (let i = 0; i < data.length; i++) { // 各データを処理
                let row = {
                    "color": (colNames["color"] in data[i]) ? String(data[i]["カテゴリ色"]) : this.defaults.color[i % this.defaults.color.length],
                    "characters": [],
                };
                this.data.settings.category[String(data[i][colNames["name"]])] = row;
            };
        },
        createCharacter() { // キャラクタ設定を読み込んでフォーマット
            const data = XLSX.utils.sheet_to_json(this.workbook.Sheets[this.defaults.sheetNames["character"]], { header: 0 });
            const colNames = this.defaults.colNames["character"];
            for (let i = 0; i < data.length; i++) { // 各データを処理
                const row = data[i];
                if (!(row[colNames["category"]] in this.data.settings.category)) { // 指定カテゴリが存在しない
                    this.state.message.push(`キャラクター「${row[colNames["name"]]}」に指定されたカテゴリ「${row[colNames["category"]]}」の設定が存在しません`);
                    continue;
                };
                const characterName = String(row[colNames["name"]]);
                const tagStr = (colNames["tag"] in row) ? String(row[colNames["tag"]]) : "";
                const tags = this.formatTag(tagStr);
                let result = {
                    "category": String(row[colNames["category"]]),
                    "birthday": this.resetDateFromLimit(this.formatDate(row[colNames["birthday"]]), "hour"),
                    "death": (colNames["death"] in row) ? this.resetDateFromLimit(this.formatDate(row[colNames["death"]]), "hour") : null,
                    "birthdayDetail": (colNames["birthdayDetail"] in row) ? String(row[colNames["birthdayDetail"]]) : "",
                    "deathdayDetail": (colNames["deathdayDetail"] in row) ? String(row[colNames["deathdayDetail"]]) : "",
                    "autoBirth": (colNames["autoBirth"] in row) ? row[colNames["autoBirth"]] : false,
                    "school": null,
                    "tags": tags,
                };
                if (this.isInvalidDate(result.birthday)) {
                    this.state.message.push(`キャラクター${characterName}に設定された誕生日が不正です`);
                    continue;
                };
                this.data.characters.push(characterName);
                this.data.settings.character[characterName] = result;
                this.data.periodEvent.events[characterName] = [];
                this.data.settings.category[result.category].characters.push(characterName);
                this.data.tags.character = this.data.tags.character.concat(tags);
            };
        },
        createCharacterSchoolInfo() { // 教育課程設定を作成
            const vm = this;
            const data = XLSX.utils.sheet_to_json(this.workbook.Sheets[this.defaults.sheetNames["school"]], { header: 0 });
            const colNames = this.defaults.colNames["school"];
            const colsMust = [colNames.characterName, colNames.name, colNames.period, colNames.startDate, colNames.age];
            // 各キャラクタごとに処理
            for (const characterName in this.data.settings.character) {
                const character = this.data.settings.character[characterName];
                const schoolData = data.filter(d => d[colNames.characterName] == characterName);
                // 各データを読んで存在しない設定を作成
                let valid = true;
                let autoBirthCount = 0;
                let autoBirthIndex = 0;
                schoolData.map(function (d, index) { // データフォーマット
                    if (vm.intersection(Object.keys(d), colsMust).length != colsMust.length) { // 必要な設定が行われていない場合
                        valid = false;
                    } else { // 任意設定項目及びデータをフォーマット
                        d.characterName = String(d[colNames["characterName"]]);
                        d.name = String(d[colNames["name"]]);
                        d.period = Number(d[colNames["period"]]);
                        d.startDate = vm.formatDate(d[colNames["startDate"]]);
                        d.startDate.setFullYear(1900);
                        d.age = Number(d[colNames["age"]]);
                        d.enterGrade = (colNames["enterGrade"] in d) ? Number(d[colNames["enterGrade"]]) : 1;
                        d.enterDate = (d[colNames["enterDate"]] in d) ? vm.formatDate(d[colNames["enterDate"]]) : _.cloneDeep(d.startDate);
                        d.autoBirth = (colNames["autoBirth"] in d) ? d[colNames["autoBirth"]] : false;
                        d.autoYear = (colNames["autoYear"] in d) ? Number(d[colNames["autoYear"]]) : 1900;
                        d.autoGrade = (colNames["autoGrade"] in d) ? Number(d[colNames["autoGrade"]]) : 1;
                        if (vm.isInvalidDate(d.startDate)) {
                            vm.state.message.push(`キャラクター「${characterName}」の教育課程「${d.name}」の起算日が不正です`);
                            valid = false;
                        } else if (vm.isInvalidDate(d.enterDate)) {
                            vm.state.message.push(`キャラクター「${characterName}」の教育課程「${d.name}」の編入日が不正です`);
                            valid = false;
                        };
                        if (d.autoBirth) {
                            autoBirthIndex = index;
                            autoBirthCount++;
                        };
                        if (d.period < d.enterGrade) {
                            vm.state.message.push(`キャラクター「${characterName}」の教育課程「${d.name}」の編入学年が所属年数を超過しています`);
                            valid = false;
                        };
                    };
                });
                if (autoBirthCount != character.autoBirth) { // 自動計算の設定が噛み合っていない
                    this.state.message.push(`キャラクター「${characterName}」の誕生年自動計算設定に問題があります`);
                    continue;
                } else if (!valid) { // データが足りない
                    this.state.message.push(`キャラクター「${characterName}」の教育課程設定で必要な設定が行われていません`);
                    continue;
                } else { // データを処理
                    // 誕生年自動設定が存在する場合、先に自動設定を行う
                    if (character.autoBirth) character.birthday = this.getBirth(character, schoolData[autoBirthIndex]);
                    // 教育課程データを作成
                    let school = [];
                    schoolData.forEach(function (d) {
                        let row = {"name": d.name};
                        // 入学後最初の誕生日を仮置きする
                        let firstBirthday = new Date(character.birthday.getTime());
                        firstBirthday.setFullYear(firstBirthday.getFullYear() + d.age);
                        // 入学1年目期間を仮置き
                        let firstYearStart = new Date(d.startDate.getTime());
                        firstYearStart.setFullYear(firstBirthday.getFullYear());
                        let firstYearEnd = new Date(d.startDate.getTime());
                        firstYearEnd.setFullYear(firstBirthday.getFullYear() + 1);
                        // 期間内に収まっていない場合、期間を1年前倒し
                        if (!(vm.isinSchoolPeriod(firstBirthday, firstYearStart, firstYearEnd))) {
                            firstYearStart.setFullYear(firstYearStart.getFullYear() - 1);
                            firstYearEnd.setFullYear(firstYearEnd.getFullYear() - 1);
                        };
                        // 学年起算開始時点と卒業時点を設定
                        row.start = firstYearStart;
                        row.end = new Date(firstYearStart.getTime());
                        row.end.setFullYear(row.end.getFullYear() + d.period);
                        // 所属開始日時を設定
                        row.enter = new Date(d.enterDate.getTime());
                        row.enter.setFullYear(row.start.getFullYear() + d.enterGrade - 1);
                        let enterYearStart = new Date(row.start.getTime());
                        enterYearStart.setFullYear(enterYearStart.getFullYear() + d.enterGrade - 1);
                        let enterYearEnd = new Date(enterYearStart.getTime());
                        enterYearEnd.setFullYear(enterYearEnd.getFullYear() + 1);
                        // 期間内に収まっていない場合、期間を1年後ろ倒し
                        if (!vm.isBetween(row.enter, enterYearStart, enterYearEnd)) {
                            row.enter.setFullYear(row.enter.getFullYear() + 1);
                        };
                        // データを追加
                        school.push(row);
                    });
                    // 教育課程データを処理順に並び替え
                    school.sort((a, b) => a.enter - b.enter);
                    let currentEnd = new Date(1900, 0, 1);
                    school.forEach(function (elem, index) { // 転入期間が食い込んでいる場合は前のendを書き換え
                        if ((index != 0) && (elem.enter < currentEnd)) {
                            school[index - 1].end = elem.enter;
                        };
                        currentEnd = elem.end;
                    });
                    character.school = school;
                };
            };
        },
        createCharacterBirthday() { // キャラクタ設定から誕生日イベントを生成
            let rows = [];
            const colNames = this.defaults.colNames["event"];
            for (const [name, character] of Object.entries(this.data.settings.character)) {
                let data = {};
                data[colNames["category"]] = name;
                data[colNames["date"]] = character.birthday;
                data[colNames["limit"]] = "hour";
                data[colNames["title"]] = `${name}誕生`;
                data[colNames["detail"]] = character.birthdayDetail;
                rows.push(data);
            };
            return rows;
        },
        createCharacterDeathday() { // キャラクタ設定から死亡イベントを生成
            let rows = [];
            const colNames = this.defaults.colNames["event"];
            for (const [name, character] of Object.entries(this.data.settings.character)) {
                if (!(character.death === null)) {
                    let data = {};
                    data[colNames["category"]] = name;
                    data[colNames["date"]] = character.death;
                    data[colNames["limit"]] = "hour";
                    data[colNames["title"]] = `${name}死亡`;
                    data[colNames["detail"]] = character.deathdayDetail;
                    rows.push(data);
                };
            };
            return rows;
        },
        createPeriodEvent() { // 期間イベントを作成
            const data = XLSX.utils.sheet_to_json(this.workbook.Sheets[this.defaults.sheetNames["periodEvent"]], { header: 0 });
            const colNames = this.defaults.colNames["periodEvent"];
            const eventColNames = this.defaults.colNames["event"];
            for (const row of data) {
                let res = {};
                const category = String(row[colNames["category"]]);
                if (category == "all") {
                    res.characters = this.data.characters;
                } else if (category in this.data.settings.category) {
                    res.characters = this.data.settings.category[row[colNames["category"]]].characters;
                } else if (this.data.characters.indexOf(category) != -1) {
                    res.characters = [row[colNames["category"]]];
                } else {
                    this.state.message.push(`存在しないカテゴリないしキャラクター「${row[colNames["category"]]}」が期間イベントに指定されています`);
                    continue;
                };
                res.category = category;
                res.title = String(row[colNames["title"]]);
                res.limit = (colNames["limit"] in row) ? String(row[colNames["limit"]]) : "hour";
                res.startDate = this.formatDate(row[colNames["startDate"]]);
                res.startDate = this.resetDateFromLimit(res.startDate, res.limit);
                res.endDate = this.formatDate(row[colNames["endDate"]]);
                res.endDate = this.resetDateFromLimit(res.endDate, res.limit);
                res.display = (colNames["display"] in row) ? String(row[colNames["display"]]) : "day";
                res.startDetail = (colNames["startDetail"] in row) ? String(row[colNames["startDetail"]]) : "";
                res.endDetail = (colNames["endDetail"] in row) ? String(row[colNames["endDetail"]]) : "";
                res.tags = (colNames["tag"] in row) ? String(row[colNames["tag"]]) : "";
                res.important = (colNames["important"] in row) ? row[colNames["important"]] : false;
                if (this.isInvalidDate(res.startDate) || this.isInvalidDate(res.endDate)) {
                    this.state.message.push(`期間イベント「 ${res.title} 」に設定された期間が不正です`);
                    continue;
                };
                // マーカーを作成
                let startMarker = {};
                let endMarker = {};
                startMarker[eventColNames["category"]] = category;
                endMarker[eventColNames["category"]] = category;
                startMarker[eventColNames["title"]] = res.title + "開始";
                endMarker[eventColNames["title"]] = res.title + "終了";
                startMarker[eventColNames["date"]] = res.startDate;
                endMarker[eventColNames["date"]] = res.endDate;
                startMarker[eventColNames["limit"]] = res.limit;
                endMarker[eventColNames["limit"]] = res.limit;
                startMarker[eventColNames["detail"]] = res.startDetail;
                endMarker[eventColNames["detail"]] = res.endDetail;
                startMarker[eventColNames["beforeAfter"]] = "期間";
                endMarker[eventColNames["beforeAfter"]] = "期間";
                startMarker[eventColNames["tag"]] = res.tags;
                endMarker[eventColNames["tag"]] = res.tags;
                startMarker[eventColNames["important"]] = res.important;
                endMarker[eventColNames["important"]] = res.important;
                this.data.periodEvent.markers.push(startMarker);
                this.data.periodEvent.markers.push(endMarker);
                // イベントをキャラクターごとに作成
                for (const characterName of res.characters) {
                    this.data.periodEvent.events[characterName].push(res);
                };
            };
        },
        createEvent() { // イベント設定を読み込んでフォーマット
            const xlsx = XLSX.utils.sheet_to_json(this.workbook.Sheets[this.defaults.sheetNames["event"]], { header: 0 });
            const birthday = this.createCharacterBirthday();
            const deathday = this.createCharacterDeathday();
            const periodEventMarkers = this.data.periodEvent.markers;
            const data = xlsx.concat(birthday).concat(deathday).concat(periodEventMarkers);
            const settings = this.defaults.displayLimit;
            const colNames = this.defaults.colNames["event"];
            const bfKeyDict = this.defaults.beforeAfter;
            for (let i = 0; i < data.length; i++) { // 各データを処理
                const category = String(data[i][colNames["category"]]);
                let date = this.formatDate(data[i][colNames["date"]]);
                if (this.isInvalidDate(date)) {
                    this.state.message.push(`イベント「 ${res.title} 」に設定された日時が不正です`);
                    continue;
                };
                const limit = (colNames["limit"] in data[i]) ? String(data[i][colNames["limit"]]) : "hour";
                date = this.resetDateFromLimit(date, limit);
                const beforeAfterOriginal = (colNames["beforeAfter"] in data[i]) ? String(data[i][colNames["beforeAfter"]]) : "";
                const beforeAfter = (beforeAfterOriginal in bfKeyDict) ? beforeAfterOriginal : "";
                const title = String(data[i][colNames["title"]]);
                const detail = (colNames["detail"] in data[i]) ? String(data[i][colNames["detail"]]) : "";
                const tagStr = (colNames["tag"] in data[i]) ? String(data[i][colNames["tag"]]) : "";
                const tags = this.formatTag(tagStr);
                const important = (colNames["important"] in data[i]) ? data[i][colNames["important"]] : false;
                this.data.tags.event = this.data.tags.event.concat(tags);
                // 対象キャラクタデータを作成
                let characters = [];
                let eventCategory = "";
                if (category == "all") {
                    characters = Object.keys(this.data.settings.character);
                    eventCategory = "all";
                } else if (category in this.data.settings.category) {
                    characters = this.data.settings.category[category].characters;
                    eventCategory = "category";
                } else if (category in this.data.settings.character) {
                    characters = [category];
                    eventCategory = "character";
                } else {
                    this.state.message.push(`イベント「${title}」に指定されたカテゴリないしキャラクター「${category}」が存在しません`);
                    continue;
                };
                // イベントを設定
                const key = moment(date).format() + String(settings[limit]) + String(bfKeyDict[beforeAfter]);
                if (Object.keys(this.data.event).indexOf(key) == -1) {
                    this.data.event[key] = {
                        "date": date,
                        "limit": limit,
                        "beforeAfter": beforeAfter,
                        "characters": [],
                        "events": { "all": [], "category": [], "character": [] },
                        "tags": [],
                    };
                };
                const row = {
                    "title": title,
                    "category": category,
                    "characters": characters,
                    "detail": detail,
                    "tags": tags,
                    "important": important,
                };
                this.data.event[key].events[eventCategory].push(row);
                this.data.event[key].characters = this.union(characters, this.data.event[key].characters);
                this.data.event[key].tags = this.union(tags, this.data.event[key].tags);
            };
            // 時系列Keyデータを作成
            const keys = Object.keys(this.data.event);
            keys.sort();
            this.eventKeys = keys;
        },
        createYearSummary() { // 年ごとのサマリーデータをフォーマットする
            let yearSummary = {}
            for (const key of this.eventKeys) {
                const year = moment(key.slice(0, -2)).year();
                const date = new Date(year, 11, 31, 23, 59, 59);
                yearSummary[year] = {
                    "year": year,
                    "date": date,
                    "characters": [],
                    "displayLimit": this.defaults.displayLimit["second"],
                    "show": false,
                    "isFirstEvent": true,
                    "summary": true,
                    "yearRangeSummary": false,
                    "height": "0px",
                    "summarize": false,
                };
                for (characterName of this.data.characters) {
                    const character = this.data.settings.character[characterName];
                    const characterDied = (character.death === null) ? false : this.isCharacterDied(character, date);
                    yearSummary[year][`${characterName}_ev`] = [{
                        "title": "",
                        "category": "summary",
                        "characters": [characterName],
                        "numEvents": { "all": 0, "category": 0, "character": 0 },
                        "detail": "",
                        "tags": [],
                    }];
                    yearSummary[year][`${characterName}_tl`] = {
                        "name": characterName,
                        "age": this.getYearPassed(character.birthday, date),
                        "school": {},
                        "color": this.data.settings.category[character.category].color,
                        "needsArrow": true,
                        "summary": true,
                        "died": characterDied,
                        "firstAfterDied": this.isBetween(character.death, new Date(year - 1, 0, 1), new Date(year, 0, 1)),
                    };
                };
            };
            this.yearSummary = yearSummary;
        },
        createYearRangeSummary() { // 年範囲のサマリーデータをフォーマットする
            let yearRangeSummary = {};
            for (const key of Object.keys(this.yearRangeSummary)) {
                let row = {
                    "year": null,
                    "date": new Date(2000, 1, 1),
                    "characters": [],
                    "displayLimit": this.defaults.displayLimit["second"],
                    "show": false,
                    "isFirstEvent": true,
                    "summary": true,
                    "yearRangeSummary": true,
                    "height": "0px",
                    "summarize": false,
                    "start": 0,
                    "end": 0,
                };
                for (const characterName of this.data.characters) {
                    const character = this.data.settings.character[characterName];
                    row[`${characterName}_ev`] = [{
                        "title": "",
                        "category": "summary",
                        "characters": [characterName],
                        "numEvents": { "all": 0, "category": 0, "character": 0 },
                        "detail": "",
                        "tags": [],
                    }];
                    row[`${characterName}_tl`] = {
                        "name": characterName,
                        "age": -1,
                        "school": {},
                        "color": this.data.settings.category[character.category].color,
                        "needsArrow": true,
                        "summary": true,
                        "died": false,
                        "firstAfterDied": false,
                    };
                };
                yearRangeSummary[key] = row;
            };
            this.yearRangeSummary = yearRangeSummary;
        },
        setTags() { // タグから重複を排除
            this.data.tags.character = Array.from(new Set(this.data.tags.character));
                this.data.tags.event = Array.from(new Set(this.data.tags.event));
                this.data.tags.master = Array.from(new Set(this.data.tags.character.concat(this.data.tags.event)));
        },
        setRangeSliderMinMaxValue() { // 表示年スライダーの最小/最大値を設定
            const years = Object.keys(this.yearSummary).sort();
            this.displaySetting.yearRange.min = Number(years[0]);
            this.displaySetting.yearRange.max = Number(years[years.length - 1]);
            this.displaySetting.yearRange.value = [Number(years[0]), Number(years[years.length - 1])];
        },
        async formatData() { // 読み込んだxlsxをフォーマット
            if (this.validData()) {
                await this.createCategory();
                await this.createCharacter();
                await this.createCharacterSchoolInfo();
                await this.createPeriodEvent();
                await this.createEvent();
                await this.createYearSummary();
                await this.createYearRangeSummary();
                this.setTags();
                this.setRangeSliderMinMaxValue();
            };
            if (this.state.message.length != 0) {
                this.state.errorSnack = true;
            };
        },
        // Create Table Data
        createTimelineData() { // タイムラインデータを作成
            const vm = this;
            let data = [];
            let currentYear = this.data.event[this.eventKeys[0]].date.getFullYear();
            this.eventKeys.forEach(function (key) {
                const date = vm.data.event[key].date;
                const year = date.getFullYear();
                const tags = vm.data.event[key].tags;
                const eventData = vm.data.event[key].events;
                const displayLimit = vm.defaults.displayLimit[vm.data.event[key].limit];
                if (currentYear != year) {
                    data.push(vm.yearSummary[currentYear]);
                    currentYear = year;
                };
                // Template
                let template = {
                    "year": date.getFullYear(),
                    "date": date,
                    "characters": [],
                    "displayLimit": displayLimit,
                    "show": true,
                    "isFirstEvent": true,
                    "beforeAfter": vm.data.event[key].beforeAfter,
                    "summary": false,
                    "height": "0px",
                    "tags": tags,
                };
                for (const [key, category] of Object.entries(vm.data.settings.category)) {
                    const characters = category.characters;
                    characters.forEach(function (characterName) {
                        const character = vm.data.settings.character[characterName];
                        const characterDied = (character.death === null) ? false : vm.isCharacterDied(character, date);
                        template[`${characterName}_tl`] = {
                            "name": characterName,
                            "age": vm.getYearPassed(character.birthday, date),
                            "school": vm.getCharacterSchoolInfo(characterName, date),
                            "color": vm.data.settings.category[character.category].color,
                            "needsArrow": true,
                            "summary": false,
                            "died": characterDied,
                            "periodEvents": vm.getCharacterPeriodEvents(characterName, date),
                        };
                        template[`${characterName}_ev`] = [];
                    });
                };
                // Events
                const categories = ["all", "category", "character"];
                for (const categoryName of categories) {
                    if (eventData[categoryName].length > 0) { // イベントが存在する場合処理
                        let row = _.cloneDeep(template);
                        eventData[categoryName].forEach(function (event) {
                            row.characters = vm.union(row.characters, event.characters);
                            for (const characterName of event.characters) {
                                const characterBirthday = vm.data.settings.character[characterName].birthday;
                                let tmp_ev = _.clone(event);
                                tmp_ev["birthday"] = vm.isSameDate(characterBirthday, date) && (displayLimit >= 2);
                                row[`${characterName}_ev`].push(tmp_ev);
                                vm.yearSummary[year][`${characterName}_ev`][0]["numEvents"][categoryName] += 1;
                            };
                        });
                        vm.yearSummary[year].characters = vm.union(row.characters, vm.yearSummary[year].characters);
                        data.push(row);
                    };
                };
            });
            // 最後のイベントのYearからSummaryをpush
            data.push(this.yearSummary[data.slice(-1)[0].year]);

            // year range summaryを追加
            data.unshift(this.yearRangeSummary.head);
            data.push(this.yearRangeSummary.tail);

            this.timelineData = data;
        },
        createTimelineColumns() { // characterSelectedの更新に合わせてtableColumnの表示状態を更新
            const vm = this;
            const width = (100 - 6) / this.characterSelected.length;
            let headers = [{ text: '', value: "year", class:["border-none"], cellClass: ["valign-top", "pt-4"], width: "6%", }];
            for (const [key, category] of Object.entries(this.data.settings.category)) {
                const characters = category.characters;
                characters.forEach(function (character) {
                    if (vm.characterSelected.indexOf(character) != -1) {
                        headers.push({ text: '', value: `${character}_tl`, class:["table-timeline-header", "border-none"], cellClass: ["pa-0", "table-timeline-cell", "valign-top"], width: "0%", });
                        headers.push({ text: character, value: `${character}_ev`, width: `${width}%`, class: ["border-none"], cellClass: ["pl-2", "pr-4", "valign-top"], tags: vm.data.settings.character[character].tags});
                    };
                });
            };
            this.timelineHeaders = headers;
        },
        isEventTagsMatch2Row(mode, row) {
            // 処理スキップ
            if (row.summary == true) { return true; } // サマリー行の場合はreturn
            if (!this.tagBulkMode) {
                if (mode === null) { return true; }; // タグ変更なしの場合はreturn
                if (Array.isArray(mode)) { return true; } // キャラクター選択変更時はreturn
            };
            mode = (mode === null || Array.isArray(mode) || this.tagBulkMode) ? "master" : mode;
            // タグマッチ判定
            const targetTags = this.tagSelected[mode];
            if (targetTags.length === 0) { return true; }; // タグが選択されていない場合はreturn
            return this.intersection(targetTags, row.tags).length > 0;
        },
        isEventTagsMatch2Card(summary, tags) {
            if (summary) return true;
            const currentTag = (this.tagBulkMode) ? this.tagSelected["master"] : this.tagSelected["event"];
            if (currentTag.length == 0) return true;
            return (this.intersection(currentTag, tags).length == 0) ? false : true;
        },
        isYearMatch2DisplayRange(year) {
            return (this.displaySetting.yearRange.value[0] <= year) && (year <= this.displaySetting.yearRange.value[1]);
        },
        updateTimelineData(mode=null) { // characterSelectedの更新に合わせてshowの状態を更新
            let currentAge = {};
            let currentState = {};
            this.colsTL.forEach(function (colName) {
                currentAge[colName] = -1;
                currentState[colName] = false;
            });
            let currentYear = -1;
            for (let index = 0; index < this.timelineData.length; index++) {
                const row = this.timelineData[index];
                row.height = "0px";
                // 列がshow状態かどうかを判断
                if (
                    this.state.showYearRangeSummary &&
                    row.yearRangeSummary &&
                    (
                        (Object.is(this.yearRangeSummary.head, row) && row.end >= this.displaySetting.yearRange.min) ||
                        (Object.is(this.yearRangeSummary.tail, row) && row.start <= this.displaySetting.yearRange.max)
                    )
                ) {
                    row.show = true;
                } else if (
                    (this.intersection(this.characterSelected, row.characters).length > 0) && (row.summary == this.yearSummary[row.year].summarize) && this.isEventTagsMatch2Row(mode, row) && this.isYearMatch2DisplayRange(row.year)
                ) {
                    row.show = true;
                    // Year列の表示状態変更
                    if (currentYear != row.year) {
                        currentYear = row.year;
                        row.isFirstEvent = true;
                    } else {
                        row.isFirstEvent = false;
                    };
                    // 誕生日の切り替え状態と死亡状況を変更（needsArrow）
                    for (tlKey of this.colsTL) {
                        const tlTd = row[tlKey];
                        if (tlTd.age != currentAge[tlKey] && tlTd.age >= 0) {
                            currentAge[tlKey] = tlTd.age;
                            tlTd.needsArrow = true;
                        } else {
                            tlTd.needsArrow = false;
                        };
                        if (tlTd.died != currentState[tlKey]) {
                            currentState[tlKey] = tlTd.died;
                            tlTd.firstAfterDied = true;
                        } else {
                            tlTd.firstAfterDied = false;
                        };
                    };
                } else {
                    // 非表示行
                    row.show = false;
                };
            };
        },
        updateYearSummary() { // 集計したイベント数をもとにtitleを設定する
            for (const year in this.yearSummary) {
                for (const characterName of this.data.characters) {
                    const numEvents = this.yearSummary[year][`${characterName}_ev`][0].numEvents;
                    this.yearSummary[year][`${characterName}_ev`][0].title = `ALL: ${numEvents.all}件\nカテゴリ: ${numEvents.category}件\nキャラクタ: ${numEvents.character}件`;
                };
            };
        },
        aggregateYearSummary(start, end, key) {
            const targetYearRangeSummary = this.yearRangeSummary[key];
            targetYearRangeSummary.year = `${start} - ${end}`;
            targetYearRangeSummary.start = start;
            targetYearRangeSummary.end = end;
            let date = [];
            for (const characterName of this.data.characters) {
                let numEventsAll = 0;
                let numEventsCategory = 0;
                let numEventsCharacter = 0;
                for (let currentYear = start; currentYear <= end; currentYear++) {
                    if (!(String(currentYear) in this.yearSummary)) { continue; }
                    const currentYearSummary = this.yearSummary[String(currentYear)];
                    const numEvents = currentYearSummary[`${characterName}_ev`][0].numEvents;
                    const tl = currentYearSummary[`${characterName}_tl`];

                    // add num events
                    numEventsAll += numEvents.all;
                    numEventsCategory += numEvents.category;
                    numEventsCharacter += numEvents.character;

                    // set timeline infomations
                    if (!Number.isNaN(currentYearSummary.date.getTime())) date.push(currentYearSummary.date);
                };
                // set title
                targetYearRangeSummary[`${characterName}_ev`][0].title = `ALL: ${numEventsAll}件\nカテゴリ: ${numEventsCategory}件\nキャラクタ: ${numEventsCharacter}件`;

                // 範囲内で生存期間がある場合died = false
                if (key == "head") targetYearRangeSummary[`${characterName}_tl`].died = false;
                if (key == "tail") {
                    const character = this.data.settings.character[characterName];
                    const birthYear = character.birthday.getFullYear();
                    if (character.death === null) {
                        targetYearRangeSummary[`${characterName}_tl`].died = false;
                        continue;
                    }
                    const deathYear = character.death.getFullYear();
                    const aliveRange = this.range(birthYear, deathYear);
                    const aggregateRange = this.range(start, end);
                    const lenAliveYears = this.intersection(aliveRange, aggregateRange).length;
                    targetYearRangeSummary[`${characterName}_tl`].died = (lenAliveYears == 0);
                };
            };
            if (key == "head") {
                targetYearRangeSummary.date = new Date(Math.max(...date));
            } else if (key == "tail") {
                targetYearRangeSummary.date = new Date(Math.min(...date));
            };
        },
        updateYearRangeSummary() { // 表示設定に合わせて先頭と末尾のyearRangeSummaryを作成
            const displayStartYear = Number(this.displaySetting.yearRange.value[0]);
            const displayEndYear = Number(this.displaySetting.yearRange.value[1]);
            const startYear = this.displaySetting.yearRange.min;
            const endYear = this.displaySetting.yearRange.max;
            this.aggregateYearSummary(startYear, displayStartYear - 1, "head");
            this.aggregateYearSummary(displayEndYear + 1, endYear, "tail");
        },
        // Functions
        async init() { // 初期化処理
            const vm = this;
            this.state.ready = false;
            this.state.message = [];
            this.data = _.cloneDeep(this.defaults.data);
            await this.formatData();
            if (this.eventKeys.length > 0) {
                await Object.keys(this.data.settings.category).forEach(key => {
                    vm.selectAllCharactersInCategory(key);
                });
                await this.createTimelineData();
                this.updateYearSummary();
                await this.updateTimelineData(null);
                this.state.loading = false;
                this.state.ready = true;
            } else {
                this.state.loading = "error";
            };
        },
        async update(mode = null) { // 表示キャラクター変更時にデータリセットとスタイリングを行う
            await this.createTimelineColumns();
            await this.updateTimelineData(mode);
            await this.setArrorFirstDied();
            this.$nextTick(function () { // DOM更新後に処理
                this.setInnerTdHeight();
            });
        },
        windowResized: _.debounce( async function() { // windowサイズ変更時にtdの高さを設定し直す
            await this.setTableHeight();
            this.setCharacterDatabaseWidth();
            this.setCharacterDatabaseChartWH();
        }, 300),
        toggleYearSummaryShow(year) { // 要約行に切り替えるかどうかを設定
            this.yearSummary[year].summarize = !this.yearSummary[year].summarize;
        },
        // Filter
        selectAllCharactersInCategory(category) { // categoryに所属するキャラクタのチェックボックスにチェックを入れる
            const vm = this;
            const characters = this.data.settings.category[category].characters;
            characters.forEach(function (character) {
                if (vm.characterSelected.indexOf(character) == -1) {
                    vm.characterSelected.push(character);
                };
            });
        },
        removeAllCharactersInCategory(category) { // categoryに所属するキャラクタのチェックボックスのチェックを外す
            const vm = this;
            const characters = this.data.settings.category[category].characters;
            characters.forEach(function (character) {
                const index = vm.characterSelected.indexOf(character);
                if (index != -1) {
                    vm.characterSelected.splice(index, 1);
                };
            });
        },
        changeCharacterSelected(tags) { // 現在のタグ選択状態に合わせてキャラクター表示状態を更新
            if (tags.length == 0) { // タグ選択が全解除状態の場合は全キャラクターを選択状態に戻す
                this.characterSelected = [...this.data.characters];
                return;
            };
            // 通常選択時
            const characters = this.data.settings.character;
            let characterSelected = [];
            for (const [characterName, characterData] of Object.entries(characters)) {
                const isTargetCharacter = this.intersection(tags, characterData.tags).length > 0;
                if (isTargetCharacter) {
                    characterSelected.push(characterName);
                };
            };
            this.characterSelected = Array.from(new Set(characterSelected));
        },
        changeTagState(mode) { // タグ選択状態の変更に合わせて更新
            const targetTags = this.tagSelected[mode];
            if (mode == "character" || mode == "master") {
                this.changeCharacterSelected(targetTags);
            };
            if (mode == "event" || mode == "master") {
                this.update(mode);
            };
        },
        selectAllTags(mode) { // タグをすべて選択する
            const vm = this;
            const tags = this.data.tags[mode];
            tags.forEach(function (tag) {
                if (vm.tagSelected[mode].indexOf(tag) == -1) {
                    vm.tagSelected[mode].push(tag);
                };
            });
            this.changeTagState(mode);
        },
        removeAllTags(mode) { // タグをすべて選択解除する
            const vm = this;
            const tags = this.data.tags[mode];
            tags.forEach(function (tag) {
                const index = vm.tagSelected[mode].indexOf(tag);
                if (index != -1) {
                    vm.tagSelected[mode].splice(index, 1);
                };
            });
            this.changeTagState(mode);
        },
        changeTagBulkMode() {
            if (this.tagBulkMode) {
                this.changeTagState("master");
            } else {
                this.changeTagState("character");
                this.changeTagState("event");
            };
        },
        displayYearRangeChanged() { // 表示年領域変更時に呼び出し
            if (
                this.displaySetting.yearRange.value[0] == Number(this.displaySetting.yearRange.min) &&
                this.displaySetting.yearRange.value[1] == Number(this.displaySetting.yearRange.max)
            ) {
                // delete year range summary
                this.state.showYearRangeSummary = false;
            } else {
                // initialize year range summary
                this.state.showYearRangeSummary = true;
                this.updateYearRangeSummary();
            };
            this.update(null);
        },
        changeHighlightState() {
            this.state.highlightMode = !this.state.highlightMode;
        },
        changeShowDisplaySettingState() {
            this.state.showDisplaySetting = !this.state.showDisplaySetting;
        },
        // Styling
        setTableHeight() { // Window Heightに合わせてテーブルのmax-heightを設定する
            const windowHeight = window.innerHeight;
            const sumPadding = 46;
            const tableTop = document.querySelector("#timelineParent").getBoundingClientRect();
            this.tableHeight = windowHeight - tableTop.y - sumPadding;
        },
        setArrorFirstDied() { // 死んだ次のイベントにArrowを設定する
            const arrows = document.querySelectorAll(".svgFill");
            for (const arrow of arrows) {
                const g = arrow.querySelectorAll('g');
                g.forEach(function (element) {
                    element.setAttribute('fill', arrow.dataset.color);
                });
            };
        },
        setInnerTdHeight() { // 親の高さに合わせてTd内部のheightを変更する
            const vm = this;
            const trs = document.querySelectorAll(".timeline-tr");
            trs.forEach(function (tr, index) {
                vm.timelineData[index].height = String(tr.clientHeight) + "px";
            });
        },
        replaceDisplaySettingSnackbar() { // DisplaySettingのSnackbar表示位置を強制的に変更する
            const displaySettingSnackbarParent = document.querySelector("#displaySettingSnackbarParent");
            const displaySettingSnackbar = displaySettingSnackbarParent.children[0];
            const header_end = document.querySelector("header").getBoundingClientRect().bottom;
            displaySettingSnackbarParent.style.justifyContent = "right";
            displaySettingSnackbarParent.style.alignItems = "flex-start";
            displaySettingSnackbar.style.marginTop = String(header_end + 12) + "px";
            displaySettingSnackbar.style.marginRight = "20px"
        },
        changeAccordionDisplayState() { // 設定アコーディオンの表示状態を変更する
            const vm = this;
            const accordions = document.querySelectorAll(".accordionParent");
            accordions.forEach(function (accordion, index, array) {
                accordion.style.display = (vm.displaySetting.showAccordion)? "":"none";
            });
            this.$nextTick(function () { // DOM更新後に処理
                this.setTableHeight();
            });
        },
        //
        //########################
        // Character Data Base
        //########################
        //
        setCharacterDatabaseWidth() {
            this.characterDatabase.width = window.innerWidth*0.75;
        },
        setCharacterDatabaseChartWH() {
            let cdbParent = document.querySelector("#cdbChartParent");
            let cdbCompareParent = document.querySelector("#cdbCompareChartParent");
            let parentElement = (cdbParent !== null) ? cdbParent : cdbCompareParent;
            if (parentElement === null) return;

            const width = parentElement.parentElement.clientWidth;
            if (width != 0) { this.characterDatabase.chartWidth = width };
            if (cdbParent !== null) cdbParent.style.height = `${this.characterDatabase.chartWidth}px`;
            if (cdbCompareParent !== null) cdbCompareParent.style.height = `${this.characterDatabase.chartWidth * 1.2}px`;
        },
        readCharacterDatabaseFile: function (file) { // xlsx読み込み
            const vm = this;
            const reader = new FileReader();
            reader.onload = function (e) {
                let data = e.target.result;
                vm.characterDatabaseWorkbook = XLSX.read(data, { 'type': 'binary' })
            };
            reader.readAsBinaryString(file);
        },
        // Data Create
        validCdbData() { // キャラクターデータが存在するか確認する
            const sheetNames = this.characterDatabaseWorkbook.SheetNames;
            let valid = true;
            if (sheetNames.length == 1 && sheetNames[0] == "TEMPLATE") {
                this.state.message.push("エクセルファイルにキャラクターが登録されていません");
                valid = false;
            }
            for (let sheetName of sheetNames) {
                const data = XLSX.utils.sheet_to_json(this.workbook.Sheets[sheetName], { header: 1 });
                const colNames = Object.values(this.defaults.characterDatabase);
                for (let colName of colNames) {
                    if (data[0].indexOf(colName) == -1) {
                        this.state.message.push(`${sheetName}シートに以下の列が存在しません: ${colName}`);
                            valid = false;
                    }
                }
            }
            this.characterDatabase.state.fileError = !valid;
            return valid;
        },
        createCharacterPage(characterName) { // キャラクタデータを作成して登録する
            // init
            const rawData = XLSX.utils.sheet_to_json(this.characterDatabaseWorkbook.Sheets[characterName], { header: 0 });
            let data = _.cloneDeep(this.characterDatabase.template);
            const dtypes = Object.keys(data);
            const colNames = this.defaults.characterDatabase;

            // 各行を処理
            for (let row of rawData) {
                const dtype = row[colNames.dtype];
                if (!dtype in dtypes) {
                    this.state.message.push(`キャラクター${characterName}に設定されている以下のデータ型は無視されます：${dtype}`)
                    continue;
                }
                data.name = characterName;
                let value = row[colNames.value];
                if (dtype == "group" || dtype == "caption") {
                    data[dtype] = value;
                    continue;
                }  else if (dtype == "img") {
                    data.img.push({ src: value });
                    continue;
                }
                const index = row[colNames.index];
                if (dtype == "date") {
                    value = this.formatDate(value);
                }
                data[dtype][index] = value;
                if (this.characterDatabase.columns[dtype].indexOf(index) == -1) {
                    this.characterDatabase.columns[dtype].push(index);
                }
            }

            // キャラクタ一覧にキャラクタを登録
            if (Object.keys(this.characterDatabase.characters).indexOf(data.group) == -1) {
                this.characterDatabase.characters[data.group] = [];
            }
            this.characterDatabase.characters[data.group].push(characterName);

            // キャラクタデータを登録
            this.characterDatabase.data[characterName] = data;
        },
        createCharacterChartData(characterName) { // chart用データを作成
            const data = this.characterDatabase.data[characterName].chart;
            if (data.length == 0) return;

            let labels = [];
            let dataset = {
                label: characterName,
                data: [],
                backgroundColor: this.primaryColorAlpha,
                borderColor: this.primaryColor,
                pointBackgroundColor: this.primaryColor,
                pointBorderColor: this.primaryColor,
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: this.primaryColor,
            };
            for (let [k, v] of Object.entries(data)) {
                labels.push(k);
                dataset.data.push(v);
            }
            this.characterDatabase.chartData[characterName] = {
                labels: labels,
                datasets: [dataset],
            }
        },
        createCompareChartData() {
            const colNames = this.characterDatabase.columns.chart;
            let datasets = [];
            for (const character of this.characterDatabase.characterList) {
                if (character.disabled) continue;
                const characterName = character.name;
                let data = [];
                const df = this.characterDatabase.data[characterName].chart;
                for (const colName of colNames) {
                    data.push((Object.keys(df).indexOf(colName) == -1) ? null : df[colName]);
                }
                const colorIndex = datasets.length % this.defaults.color.length;
                const color = this.defaults.color[colorIndex];
                let dataset = {
                    label: characterName,
                    data: data,
                    fill: false,
                    backgroundColor: color,
                    borderColor: color,
                    pointBackgroundColor: color,
                    pointBorderColor: color,
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: color,
                }
                datasets.push(dataset);
            }
            this.characterDatabase.compareChartData = {
                labels: colNames,
                datasets: datasets,
            }
        },
        createCharacterList() { // キャラクタタブ用のリストを作成する
            let res = [];
            for (const groupName in this.characterDatabase.characters) {
                const characters = this.characterDatabase.characters[groupName];
                res.push({ name: groupName, disabled: true });
                for (const character of characters) {
                    res.push({ name: character, disabled: false });
                }
            }
            this.characterDatabase.characterList = res;
        },
        createColumnList() { // compareタブ用のリストを作成する
            let res = [];
            for (const dtype in this.characterDatabase.columns) {
                const columns = this.characterDatabase.columns[dtype];
                res.push({ colName: dtype, disabled: true });
                for (const colName of columns) {
                    res.push({ colName: colName, disabled: false, dtype: dtype });
                }
            }
            this.characterDatabase.columnList = res;
        },
        initCharacterDatabaseChart() { // タブ選択/ファイル読み込み時にグラフの初期化を行う
            const selectedRow = this.characterDatabase.characterList[this.characterDatabase.characterListSelected];
            if (selectedRow === undefined) return;

            const characterName = selectedRow.name;
            if (Object.keys(this.characterDatabase.chartData).indexOf(characterName) == -1) return;

            let cnv = document.querySelector("#cdbChart");
            if (cnv === null) return;

            this.setCharacterDatabaseChartWH();

            const data = this.characterDatabase.chartData[characterName];
            if (this.characterDatabase.chart === null) {
                let ctx = cnv.getContext("2d");
                this.characterDatabase.chart = new Chart(ctx, {
                    type: "radar",
                    data: data,
                    options: this.characterDatabase.chartOptions
                });
            } else {
                this.characterDatabase.chart.data = data;
                this.characterDatabase.chart.update();
            }
        },
        initCharacterDatabaseCompareChart() {
            let cnv = document.querySelector("#cdbCompareChart");
            if (cnv == null) return;

            this.setCharacterDatabaseChartWH();

            if (this.characterDatabase.compareChart === null) {
                let options = _.cloneDeep(this.characterDatabase.chartOptions);
                options.plugins.legend.display = true;
                options.plugins.colorschemas = {};
                options.plugins.colorschemas.scheme = "tableau.HueCircle19";
                let ctx = cnv.getContext("2d");
                this.characterDatabase.compareChart = new Chart(ctx, {
                    type: "radar",
                    data: this.characterDatabase.compareChartData,
                    options: options
                });
            } else {
                this.characterDatabase.compareChart.data = this.characterDatabase.compareChartData;
                this.characterDatabase.compareChart.update();
            }
        },
        clearCharacterDatabase() { // キャラクタDBのデータクリア
            this.characterDatabase.characters = {};
            this.characterDatabase.characterList = [];
            this.characterDatabase.data = {};
            this.characterDatabase.columnList = [];
        },
        async initCharacterDatabase() { // キャラクターDBの初期化
            if (this.validCdbData) {
                this.state.message = [];
                this.clearCharacterDatabase();
                for (let sheetName of this.characterDatabaseWorkbook.SheetNames) {
                    await this.createCharacterPage(sheetName);
                    await this.createCharacterChartData(sheetName);
                }
                await this.createCharacterList();
                await this.createColumnList();
                await this.initCharacterDatabaseChart();
                await this.createCompareChartData();
                await this.initCharacterDatabaseCompareChart();
                this.characterDatabase.state.ready = true;
                this.characterDatabase.mainTab = 1;
                this.characterDatabase.dataTab = 0;
            }
        },
        changeCompareTabValue() { // 比較ページの表示切り替えボタン押下時、表示を変更&初期化
            this.setCharacterDatabaseChartWH();
            this.initCharacterDatabaseCompareChart();
            if (this.characterDatabase.compareTab == 1) {
                this.characterDatabase.compareTab = 0;
            } else {
                this.characterDatabase.compareTab = 1;
            };
        },
        resetCrosstabDuplicatedValue(idx) { // 選択フォームで同値選択が行われた際、下位のフォームの値をリセットする
            let crossTabValue = this.characterDatabase.crossTabValue;
            if (idx == 2) return;
            if (
                (crossTabValue[2] == crossTabValue[1]) ||
                (crossTabValue[2] == crossTabValue[0])
            ) crossTabValue[2] = null;
            if (idx == 1) return;
            if (crossTabValue[1] == crossTabValue[0]) crossTabValue[1] = null;
        },
        characterClicked(characterName) { // キャラクタページに遷移する
            const characters = this.characterDatabase.characterList.filter((character) => character.name == characterName && !character.disabled);
            if (characters.length == 0 || this.characterDatabaseWorkbook === null) return;
            if (!this.state.showCharacterDB) this.state.showCharacterDB = true;
            const character = characters[0];
            const characterIndex = this.characterDatabase.characterList.indexOf(character);
            this.characterDatabase.mainTab = 1;
            this.characterDatabase.characterListSelected = characterIndex;
        },
        columnClicked(colName) { // 項目比較ページに遷移する
            const column = this.characterDatabase.columnList.filter((column) => column.colName == colName && !column.disabled)[0];
            const colIndex = this.characterDatabase.columnList.indexOf(column);
            this.characterDatabase.mainTab = 2;
            this.characterDatabase.columnListSelected = colIndex;
        },
        undisplayDisplaySetting() { // display settingを非表示にする
            this.state.showDisplaySetting = false;
        }
    },
});

