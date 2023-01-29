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
        fileSelected: null,
        workbook: null,
        state: { "fileError": false, "ready": false, "loading": false, domUpdated: false, "message": [], "errorSnack": false },
        defaults: {
            "color": ["#47cacc", "#63bcc9", "#cdb3d4", "#e7b7c8", "#ffbe88"],
            "sheetNames": { "category": "カテゴリー", "character": "キャラクター", "school": "教育課程", "event": "イベント", "periodEvent": "期間イベント" },
            "colNames": {
                "category": { "name": "カテゴリ名", "color": "カテゴリ色", "bgcolor": "カテゴリ色" },
                "character": { "name": "キャラクタ名", "category": "カテゴリ", "birthday": "誕生日", "death": "死亡日", "birthdayDetail": "誕生日詳細", "deathdayDetail": "死亡日詳細", "autoBirth": "誕生年自動計算" },
                "school": { "characterName": "キャラクタ名", "name": "教育課程名", "period": "基準所属年数", "startDate": "起算日", "age": "開始年齢", "enterGrade": "編入学年", "enterDate": "編入日", "autoBirth": "誕生年自動計算に使用", "autoYear": "誕生年起算年", "autoGrade": "誕生年起算学年" },
                "event": { "category": "カテゴリ", "title": "タイトル", "date": "日時", "limit": "以下を無視", "beforeAfter": "以前 / 以降", "detail": "詳細" },
                "periodEvent": { "category": "カテゴリ", "title": "タイトル", "startDate": "開始日時", "endDate": "終了日時", "limit": "以下を無視", "display": "経過時間粒度", "startDetail": "開始時詳細", "endDetail": "終了時詳細" },
            },
            "displayLimit": { "month": 0, "day": 1, "hour": 2, "minute": 3, "second": 4 },
            "displayTime": { "year": "年", "month": "ヶ月", "day": "日", "hour": "時間", "minute": "分", "second": "秒" },
            "beforeAfter": { "以前": 0, "": 1, "期間": 1, "以降": 2 },
            "backgroundColor": "rgb(247, 248, 247)",
            "borderColor": "rgb(229, 229, 229)",
            "summaryBackgroundColor": "#DADADA"
        },
        data: { "settings": { "category": {}, "character": {}, "school": {}, }, "event": {}, "periodEvent": {"events": {}, "markers": []}, "characters": [] },
        characterSelected: [],
        eventKeys: [],
        timelineHeaders: [],
        timelineData: [],
        yearSummary: {},
        tableHeight: 0,
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
    },
    mounted: function () {
        this.defaults.data = JSON.parse(JSON.stringify(this.data));
        window.addEventListener("resize", this.windowResized);
        this.$nextTick(function () {
            this.setTableHeight();
        });
    },
    beforeDestroy: function () {
        window.removeEventListener("resize", this.windowResized);
    },
    watch: {
        workbook: 'init',
        characterSelected: 'update',
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
        returnCardTextClass(category) { // カードの表示モードを返却
            if (category in this.data.settings.category) {
                return 'white--text';
            } else {
                return '';
            };
        },
        returnCardClass(index, events) { // rowにあるカードの数に応じてマージン設定クラスを返す
            const numEvents = events.length;
            if (numEvents == 0 || index == numEvents - 1) {
                return "my-2";
            } else {
                return "mb-4 mt-2";
            };
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
            if (data.age < 0 || data.died == true) return `background-color: ${this.defaults.backgroundColor};`;
            return `background-color: ${data.color};`;
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
                let result = {
                    "category": String(row[colNames["category"]]),
                    "birthday": this.resetDateFromLimit(this.formatDate(row[colNames["birthday"]]), "hour"),
                    "death": (colNames["death"] in row) ? this.resetDateFromLimit(this.formatDate(row[colNames["death"]]), "hour") : null,
                    "birthdayDetail": (colNames["birthdayDetail"] in row) ? String(row[colNames["birthdayDetail"]]) : "",
                    "deathdayDetail": (colNames["deathdayDetail"] in row) ? String(row[colNames["deathdayDetail"]]) : "",
                    "autoBirth": (colNames["autoBirth"] in row) ? row[colNames["autoBirth"]] : false,
                    "school": null,
                };
                if (this.isInvalidDate(result.birthday)) {
                    this.state.message.push(`キャラクター${characterName}に設定された誕生日が不正です`);
                    continue;
                };
                this.data.characters.push(characterName);
                this.data.settings.character[characterName] = result;
                this.data.periodEvent.events[characterName] = [];
                this.data.settings.category[result.category].characters.push(characterName);
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
                    };
                };
                const row = {
                    "title": title,
                    "category": category,
                    "characters": characters,
                    "detail": detail,
                };
                this.data.event[key].events[eventCategory].push(row);
                this.data.event[key].characters = this.union(characters, this.data.event[key].characters);
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
        async formatData() { // 読み込んだxlsxをフォーマット
            if (this.validData()) {
                await this.createCategory();
                await this.createCharacter();
                await this.createCharacterSchoolInfo();
                await this.createPeriodEvent();
                await this.createEvent();
                await this.createYearSummary();
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
                const eventData = vm.data.event[key].events;
                if (currentYear != year) {
                    data.push(vm.yearSummary[currentYear]);
                    currentYear = year;
                };
                // Template
                let template = {
                    "year": date.getFullYear(),
                    "date": date,
                    "characters": [],
                    "displayLimit": vm.defaults.displayLimit[vm.data.event[key].limit],
                    "show": true,
                    "isFirstEvent": true,
                    "beforeAfter": vm.data.event[key].beforeAfter,
                    "summary": false,
                    "height": "0px",
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
                                row[`${characterName}_ev`].push(event);
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
                        headers.push({ text: character, value: `${character}_ev`, width: `${width}%`, class: ["border-none"], cellClass: ["pl-2", "pr-4", "valign-top"] });
                    };
                });
            };
            this.timelineHeaders = headers;
        },
        updateTimelineData() { // characterSelectedの更新に合わせてshowの状態を更新
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
                if ((this.intersection(this.characterSelected, row.characters).length > 0) && (row.summary == this.yearSummary[row.year].summarize)) {
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
                await this.updateTimelineData();
                this.state.loading = false;
                this.state.ready = true;
            } else {
                this.state.loading = "error";
            };
        },
        async update() { // 表示キャラクター変更時にデータリセットとスタイリングを行う
            await this.createTimelineColumns();
            await this.updateTimelineData();
            await this.setArrorFirstDied();
            this.$nextTick(function () { // DOM更新後に処理
                this.setInnerTdHeight();
            });
        },
        windowResized: _.debounce( async function() { // windowサイズ変更時にtdの高さを設定し直す
            await this.setTableHeight();
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
    },
});

