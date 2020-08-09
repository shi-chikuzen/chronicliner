// Copyright (c) 2020 @shi_chikuzen
// ccrはchroniclinerの略です
var ccr = ccr || {};
(function(){
  // 便利関数
  // JSにないProcessing_mapとsumを設定
  ccr.utils = {};
  ccr.utils.map = function(value, start1, end1, start2, end2) {
    return start2 + (end2 - start2) * ((value - start1) / (end1 - start1));
  }
  ccr.utils.sum  = function(arr){
    return arr.reduce(function(prev, current, i, arr) {
        return prev+current;
    });
  };
  // いつか使うかもしれないのでグラデ関数は残しておく
  ccr.utils.gradientmap = function(step, gradient){
    // stepの数だけの色をグラデーションから抽出する
    // ということは
    // グラデをstep-1で割った結果を配列にして返せば良い
    let picker = function(step, k){
      let pct = (100 / (step - 1)) * k;
      let color = undefined;
      // 指定した階層のグラデの色を返す
      $.each(gradient, function(index, value){
        let c1 = value[1];
        let c2 = gradient[index + 1][1];
        if (value[0] <= pct && pct <= gradient[index + 1][0]) { // グラデーション範囲内のとき
          // 当該範囲内でのpctを算出
          let pct_min = pct / gradient[index + 1][0];
          color = $.Color(ccr.utils.map(pct_min, 0, 1, c1.red(), c2.red()), ccr.utils.map(pct_min, 0, 1, c1.green(), c2.green()), ccr.utils.map(pct_min, 0, 1, c1.blue(), c2.blue()), ccr.utils.map(pct_min, 0, 1, c1.alpha(), c2.alpha()));
          return false;
        };
        if (index + 2 == gradient.length) return false; //magic
      });
      return color;
    };
    let res = Array.from({length: step}, (v, k) => picker(step, k));
    return res;
  };
  ccr.utils.getIndex = function(value, arr, prop) {
    for(var i = 0; i < arr.length; i++) {
        if(arr[i][prop] === value) {
            return i;
        };
    };
    return -1; //値が存在しなかったとき
  };
  ccr.utils.getLigthterColor = function(c){
    return $.Color({ hue: c.hue(), saturation: c.saturation(), lightness: (c.lightness() > 0.8)? c.lightness() * 1.1:0.8, alpha: c.alpha() });
  };

  // HTMLテンプレートの設定
  ccr.draw = function(){
    // テンプレを作成
    ccr.draw.template = {};
    ccr.draw.template.dset = {};
    ccr.draw.template.timeline = {};
    ccr.draw.template.svg = {};
    ccr.draw.template.color = {};

    // dset template
    ccr.draw.template.dset.discon = '<li class="uk-active"><a href="#"><span class="uk-margin-small-left">#####</span></a></li>';
    ccr.draw.template.dset.discon_form = {};
    ccr.draw.template.dset.discon_form.parent = '<li><span class="checkcontroller size">すべてチェック解除</span><div class="uk-margin uk-grid-large uk-child-width-auto uk-grid">#####</div></li>';
    ccr.draw.template.dset.discon_form.children = '<label><input class="uk-margin-small-right uk-checkbox check" type="checkbox" checked>#####</label>';

    // timeline template
    ccr.draw.template.timeline.meta = '<th class="meta"></th>';
    ccr.draw.template.timeline.LChead = '<th class="##### user_##### category_#####">#####</th>';
    ccr.draw.template.timeline.SChead = '<th class="##### user_#####">#####</th>';
    ccr.draw.template.timeline.trbase = '<tr class="timeline_tr" #####>#####</tr>';
    ccr.draw.template.timeline.tdyear = '<td class="timeline_tdyear font" data-year="#####">#####</td>';
    ccr.draw.template.timeline.tdage = '<td class="timeline_tdempty timeline_age user_##### #####" #####></td>';
    ccr.draw.template.timeline.agetooltip = 'uk-tooltip="title: #####; pos: right"';
    ccr.draw.template.timeline.tdmsg = '<td class="##### ##### uk-inline timeline_contents">#####</td>';
    ccr.draw.template.timeline.tdmsgfmt = '<div class="uk-flex uk-flex-between timeline_card uk-margin-small-right"><div class="uk-flex uk-flex-column uk-flex-center uk-margin-small-right uk-margin-small-left"><div class="timeline_month uk-text-center font uk-margin-small-top">#####</div><div class="timeline_day uk-text-center font uk-margin-small-bottom">#####</div></div><div class="timeline_abstract uk-flex uk-flex-column uk-flex-center uk-padding-small uk-padding-remove-left"><div class="uk-text-center">#####</div></div></div>#####';
    ccr.draw.template.timeline.tddd = '<div uk-dropdown="pos: bottom-justify">#####</div>'

    // svg
    ccr.draw.template.svg.fill = '<div class="svg uk-child-width-1-1 uk-flex uk-flex-column"><img src="./svg/fill.svg" uk-svg></div>';
    ccr.draw.template.svg.nofill = '<div class="svg uk-child-width-1-1 uk-flex uk-flex-column"><img src="./svg/nofill.svg" uk-svg></div>';

    // color
    ccr.draw.template.color.gradient = [
      "linear-gradient(127deg, #47cacc, #cdb3d4)",
      "linear-gradient(127deg, #63bcc9, #47cacc)",
      "linear-gradient(127deg, #cdb3d4, #ffbe88)",
      "linear-gradient(127deg, #e7b7c8, #cdb3d4)",
      "linear-gradient(127deg, #ffbe88, #e7b7c8)",
    ];
    ccr.draw.template.color.color = [
      "#47cacc", "#63bcc9", "#cdb3d4", "#e7b7c8", "#ffbe88"
    ];
  };

  // 初期設定（CSVが読み込まれたときにやる）
  ccr.init = function(data){
    // Data
    ccr.data = {};
    ccr.data.user = {};
    ccr.data.category = {};
    ccr.data.timeline = [];
    ccr.data.maxage = 0;

    // 教育機関の名前（初期設定）
    ccr.data.school = {};
    ccr.data.school.name = {
      4: ["小学校", "小学校", "小学校", "小学校", "小学校", "小学校", "中学校", "中学校", "中学校", "高校", "高校", "高校"],
      9: ["Kinder", "Elem", "Elem", "Elem", "Elem", "Elem", "Middle", "Middle", "Middle", "High", "High", "High", "High"]
    };
    ccr.data.school.ggrade = {
      4: [1, 2, 3, 4, 5, 6, 1, 2, 3, 1, 2, 3],
      9: [1, 1, 2, 3, 4, 5, 1, 2, 3, 1, 2, 3, 4]
    };

    // データを分類、格納する
    $.each(data, function(idx, val){
      if (idx == 0) { // column setting
        ccr.data.columns = val;
      } else {
        // 扱いやすいようにデータを変換する
        let tmp = {};
        $.each(val, function(i, v){
          tmp[ccr.data.columns[i]] = v;
        });
        // setかtimelineかで分けて処理
        if (tmp.Setting == 1) {
          // 大カテゴリが存在するか確認、なければテンプレで初期化
          if (!ccr.data.category[tmp.LCategory]) {
            ccr.data.category[tmp.LCategory] = {
              "color": undefined,
              "subcolor": undefined,
              "user": []
            };
          };
          // 小カテゴリが存在するか確認、なければテンプレで初期化
          if (!ccr.data.user[tmp.SCategory] && tmp.SCategory != "") {
            ccr.data.user[tmp.SCategory] = {
              "Lcategory": tmp.LCategory,
              "setBirth": undefined,
              "setGrade": undefined,
              "birth": undefined,
              "school": {
                "age": undefined,
                "gyear": undefined,
                "uyear": undefined,
                "entry": undefined,
                "uentry": undefined,
                "init": undefined,
                "gperiod": undefined,
                "uperiod": undefined,
                "gname": undefined,
                "ggrade": undefined
              }
            };
            ccr.data.category[tmp.LCategory].user.push(tmp.SCategory);
          };
          // 実際のデータを読んで、当てはまるものに設定
          if (tmp.SCategory == "") { // 大カテゴリ色設定
            if (tmp.Abstract != "") { // カラーが指定されている場合
              // カラーを変換
              let c = $.Color(tmp.Abstract)
              ccr.data.category[tmp.LCategory].color = c;
              ccr.data.category[tmp.LCategory].subcolor = ccr.utils.getLigthterColor(c);
            };
          } else if (tmp.Abstract == "b") { // 誕生日を設定
            ccr.data.user[tmp.SCategory].birth = new Date(Number(tmp.Year), Number(tmp.Month) - 1, Number(tmp.Day));
            if (tmp.Year == "") { // 逆算が必要かどうかを設定
              ccr.data.user[tmp.SCategory].setBirth = false;
            } else {
              ccr.data.user[tmp.SCategory].setBirth = true;
            };
          } else if (tmp.Abstract == "e") { // 義務教育の開始年齢と4月/9月入学を指定
            if (tmp.Year != "") {
              ccr.data.user[tmp.SCategory].school.age = Number(tmp.Year);
            };
            if (tmp.Month != "") { // 入学時期
              ccr.data.user[tmp.SCategory].school.entry = Number(tmp.Month);
            };
            if (tmp.Day != "") { // 年数設定
              ccr.data.user[tmp.SCategory].school.gperiod = tmp.Day.split("_").map(Number);
              if (tmp.Detail != "") {
                // 名称をアンダースコアで割って繰り返し、配列にする
                let sum = ccr.utils.sum(ccr.data.user[tmp.SCategory].school.gperiod);
                let detail = tmp.Detail.split("_");
                let names = [];
                let grades = [];
                $.each(ccr.data.user[tmp.SCategory].school.gperiod, function(i, e){
                  grades.push(Array.from({length: e}, (v, k) => k + 1));
                  names.push(Array(e).fill(detail[i]));
                });
                ccr.data.user[tmp.SCategory].school.ggrade = grades.flat();
                ccr.data.user[tmp.SCategory].school.gname = names.flat();
              };
            };
          } else if (tmp.Abstract == "g") { // 義務教育設定
            if (tmp.Year != "" && tmp.Date != "") { // 相対モード
              ccr.data.user[tmp.SCategory].school.init = {
                "preYear": Number(tmp.Year),
                "preGrade": Number(tmp.Day)
              };
              ccr.data.user[tmp.SCategory].setGrade = true;
            };
          } else if (tmp.Abstract == "u") { // 大学設定
            if (tmp.Month != "") { // 入学時期
              ccr.data.user[tmp.SCategory].school.uentry = tmp.Month;
            }
            if (tmp.Day != "") { //年数設定
              ccr.data.user[tmp.SCategory].school.uperiod = tmp.Day.split("_").map(Number);
            }
          };
          // Setting処理ここまで
        } else { // Timeline
          // 取り敢えずデータテンプレート
          let data = {
            "LCategory": undefined,
            "SCategory": undefined,
            "Date": undefined,
            "Missing": {"Month": undefined, "Day": undefined},
            "Abstract": undefined,
            "Detail": undefined,
            "meta": undefined
          };
          if (tmp.LCategory != "") data.LCategory = tmp.LCategory;
          if (tmp.SCategory != "") data.SCategory = tmp.SCategory;
          if (tmp.Abstract != "") data.Abstract = tmp.Abstract;
          if (tmp.Detail != "") data.Detail = tmp.Detail;
          let diff = 3;
          if (data.LCategory == "ALL") {
            diff = 1;
          } else if (data.LCategory != undefined) {
            diff = 2;
          }
          // 日付
          // 1. 全部指定されている（マイナスがない）
          // 2. いずれかが欠落（その場合、月以外は1に変換すべし）
          // 3. マイナス指定（〇〇以降の意味）
          let y = Number(tmp.Year);
          // 月の処理
          let m = undefined;
          if (tmp.Month == "") { // 月が空白
            m = 0;
            data.Missing.Month = true;
          } else if (Number(tmp.Month) < 0) {
            m = Number(tmp.Month) * -1 - 1;
            data.Missing.Month = true;
          } else {
            m = Number(tmp.Month) - 1;
          };
          // 日の処理
          let d = undefined;
          if (tmp.Day == "") {
            d = 1;
            data.Missing.Day = true;
          } else if (Number(tmp.Day) < 0) {
            d = Number(tmp.Day) * -1;
            data.Missing.Day = true;
          } else {
            d = Number(tmp.Day);
          };
          // 日付を指定
          if (data.Missing.Month == true || data.Missing.Day == true) {
            // 比較したときに遅らせるためわざと9時を指定
            data.Date = new Date(y, m, d, diff + 3);
          } else {
            data.Date = new Date(y, m, d, diff);
          }

          // データを格納
          ccr.data.timeline.push(data);
        };
      };
    });

    // 各userについてgyearとuyear（入学年）を計算
    Object.keys(ccr.data.user).forEach(function(key){
      let user = this[key];
      // 生年月日を逆算する
      if (user.setBirth == false && user.school.init != undefined){
        let birth = user.birth;
        // 通常増分は1だが、誕生月<入学月の場合は1を加算する
        let diff = 1;
        if(birth.getMonth() + 1 < user.school.entry) diff = 2;
        // 誕生年月日まで戻るために義務教育の年数を換算する
        // 4月入学なら7歳から、9月入学なら6歳からが義務教育
        if (user.school.age != undefined) {
          diff -= user.school.age;
        } else {
          (user.school.entry == 9)? diff -= 6:diff -= 7;
        };
        user.birth = new Date(user.school.init.preYear - user.school.init.preGrade + diff, birth.getMonth(), birth.getDate());
      };

      // 義務教育課程をセット
      if (user.school.entry != undefined) {
        let birth = user.birth;
        let entry = user.school.entry;
        let age = (entry == 9)? 6:7;
        if (user.school.age != undefined) age = user.school.age;
        // 早生まれかどうかで場合分けして入学年度をセット
        if (birth.getMonth() + 1 < entry) {
          user.school.gyear = birth.getFullYear() + age - 1;
        } else {
          user.school.gyear = birth.getFullYear() + age;
        };
      };

      // 大学課程をセット
      if (user.school.uentry != undefined) {
        let entry = user.school.entry;
        // 在学年数をロード、設定済みの場合は設定を優先
        let period = (entry == 9)? 13:12;
        if (user.school.gperiod != undefined) period = ccr.utils.sum(user.school.gperiod);
        // 浪人する場合は浪人年数を加算
        if (user.school.uperiod.length > 1) period += user.school.uperiod[0];
        // 大学入学年度を追加
        user.school.uyear = user.school.gyear + period;
        // 米英9月→日4月の場合、年数が切り替わる
        if (user.school.uentry > entry) user.school.uyear += 1;
      };
    }, ccr.data.user);

    // 各userの誕生日イベントを追加
    Object.keys(ccr.data.user).forEach(function(key){
      let val = this[key];
      ccr.data.timeline.push({
        "LCategory": undefined,
        "SCategory": key,
        "Date": val.birth,
        "Missing": {"Month": undefined, "Day": undefined},
        "Abstract": key + " 誕生",
        "Detail": undefined,
        "meta": "birth"
      });
    }, ccr.data.user);
    // 時系列順にtimelineをソート
    ccr.data.timeline.sort(function(a, b){
      return a.Date - b.Date;
    });
    // 時系列ごと(trごと)にデータを結合
    // ALLとカテゴリ別は強制改行するが、カテゴリ別が同時に来た場合は並べて良い、また、user同士は並べられる
    ccr.data.timeline_format = [[]];
    $.each(ccr.data.timeline, function(index, value){
      let t_lstidx = ccr.data.timeline_format.length - 1;
      if (ccr.data.timeline_format[t_lstidx].length == 0) {
        ccr.data.timeline_format[t_lstidx].push(value);
      } else {
        if (ccr.data.timeline_format[t_lstidx][0].Date - value.Date == 0) {
          ccr.data.timeline_format[t_lstidx].push(value);
        } else {
          ccr.data.timeline_format.push([value]);
        };
      };
    });

    // debug
    // console.log(ccr.data.user);
    // console.log(ccr.data.category);
    // console.log(ccr.data.timeline);
    // console.log(ccr.data.timeline_format);
  };

  // 描画内容変更時の色・レイアウト調整
  ccr.update = function(){
    // テーブルについて、データの表示非表示をいじる
    // まず、タブの中からチェックを拾ってきて表示状態を変換
    let hideusers = $('.check:not(:checked)').map(function() {
      return $(this).parent('label').text();
    });
    $.each(hideusers, function(index, value){
      // tdを消す
      $(".user_" + value).hide();
    });
    let showusers = $('.check:checked').map(function() {
      return $(this).parent('label').text();
    });
    $.each(showusers, function(index, value){
      // tdを消す
      $(".user_" + value).show();
    });
    // trについての処理
    $(".timeline_tr").each(function(index, elem){
      let data = $(elem).data();
      let display = 0;
      Object.keys(data).forEach(function(key){
        if (this[key] != "undefined") { //データが存在する時
          $.each(hideusers, function(idx, value){
            if (value == key) $(elem).attr("data-" + key, "false");
          });
          $.each(showusers, function(idx, value){
            if (value == key) {
              $(elem).attr("data-" + key, "true");
              display += 1;
            };
          });
        };
      }, data);
      // すべてfalseかundefinedのとき、そのtrを消す
      if (display <= 0) $(elem).hide();
      if (display > 0) $(elem).show();
    });
    // 表示変更ここまで

    // 表示調整
    // まず、timeline_ageのテキストを削除
    $('.timeline_age').text("");
    // カテゴリ名で必要ない部分を消す
    Object.keys(ccr.data.category).forEach(function(key){
      let tmp = "";
      $('.category_' + key + ":visible + th").each(function(index, elem){
        if (! $(elem).hasClass('timeline_age')) {
          $(elem).text(key);
          if (key != tmp){
            tmp = key;
          } else {
            $(elem).text("");
          };
        };
      });
    }, ccr.data.category);
    // 年数が切り替わっていないところのtdのborder-topをnoneにする
    // 年数が繰り返されている場合年数表記を消す
    $(".timeline_tr").css("border-top", "none");
    $("td").css("border-top", "1px solid #e5e5e5");
    let year = 0;
    $(".timeline_tr:visible").each(function(index, elem){
      let timeline_year = Number($(elem).children(".timeline_tdyear").data('year'));
      if (year != timeline_year) { //前のyearと一致しない
        $(elem).children(".timeline_tdyear").text(String(timeline_year));
        year = timeline_year;
      } else {
        $(elem).children(".timeline_tdyear").text("");
        $(elem).children("td").css("border-top", "none");
      }
    });
    $(".timeline_age").css("border-top", "none");
    $(".timeline_tr:visible").first().children("td").css("border-top", "none");
    $("#SCategory").css("border-top", "none");
    $("#SCategory").css("border-bottom", "1px solid #e5e5e5");

    // 色調整
    let count = 0;
    Object.keys(ccr.data.category).forEach(function(key){
      // カテゴリごとに色を決定する
      // 色が設定済みの場合はそれに従う
      let data = this[key];
      let color = ccr.draw.template.color.color[count % ccr.draw.template.color.color.length];
      if (data.color != undefined) color = data.color.toRgbaString();

      // theadをいじる
      $("th+.category_" + key).css("background", color).css("color", "#FFFFFF");

      // カテゴリカードの色を変更
      $(".category_" + key).children( ".timeline_card").css("background", ccr.draw.template.color.gradient[count % ccr.draw.template.color.color.length]).css("color", "#FFFFFF");

      // カテゴリ間に線を入れる
      $("th+.category_" + key + ":last").css("border-right", "2px solid #FFFFFF");

      // 年齢バーの調整
      $.each(data.user, function(idx, value){
        // 初期化
        $(":not(th)+.user_" + value + ".timeline_age").css("background-color", "rgb(247, 248, 247)").css("border_bottom", "none").css("border_top", "none").css("padding", "0").html("");
        // 年齢が存在する時は色を塗り、その年齢の一番下visibleのborderを設定する
        for (var i = 0; i < ccr.data.maxage + 1; i++) {
          $(".user_" + value + ".timeline_age_" + String(i)).css("background-color", ccr.utils.getLigthterColor($.Color(color)));
          // svg区切り線を実装
          if (i == 0) {
            $(".user_" + value + ".timeline_age_" + String(i) + ":visible").first().html(ccr.draw.template.svg.fill);
          } else {
            $(".user_" + value + ".timeline_age_" + String(i) + ":visible").first().html(ccr.draw.template.svg.nofill);
          };
        };
      });

      // 色設定用のカウントを増やす
      count += 1;
    }, ccr.data.category);
  };

  // 年表部分（本体）HTML作成
  ccr.draw.timeline = function(){
    // すべてのtimelineデータを格納したtableを作成する
    // thead：colspanは後で弄れ
    // 初期化
    $("#LCategory").html(ccr.draw.template.timeline.meta);
    $("#SCategory").html(ccr.draw.template.timeline.meta);
    // 1行目：年数（borderColorで色分け）, category（人数*2）
    // 2行目：年数（borderColorで色分け）, user（1人2列）
    let user_order = [];
    let category_order = [];
    Object.keys(ccr.data.category).forEach(function(key){
      let val = this[key];
      $.each(val.user, function(index, value){
        $("#LCategory").append(ccr.draw.template.timeline.LChead.replace("#####", "timeline_age").replace("#####", value).replace(/#####/g, key));
        $("#LCategory").append(ccr.draw.template.timeline.LChead.replace("#####", "").replace("#####", value).replace(/#####/g, key));
        $("#SCategory").append(ccr.draw.template.timeline.SChead.replace("#####", "timeline_age").replace(/#####/g, value));
        $("#SCategory").append(ccr.draw.template.timeline.SChead.replace("#####", "").replace(/#####/g, value));
        category_order.push(key);
        user_order.push(value);
      });
    }, ccr.data.category);

    // tbody
    // 初期化
    let html = "";

    // データを格納
    $.each(ccr.data.timeline_format, function(index, value){
      // setup
      let tdhtml = "";
      let trbase = ccr.draw.template.timeline.trbase;

      // 年数部分を追加
      tdhtml += ccr.draw.template.timeline.tdyear.replace(/#####/g, value[0].Date.getFullYear());

      // 本体をempty状態で作成
      let tds = [];
      let data_users = [];
      $.each(user_order, function(idx, name){
        // データをロード
        let user = ccr.data.user[name];
        let tooltip = ccr.draw.template.timeline.agetooltip;
        // 在学期間をロード
        let gperiod = (user.school.entry == 9)? 13:12;
        gperiod = (user.school.gperiod == undefined)? gperiod:ccr.utils.sum(user.school.gperiod)
        let uperiod = (user.school.uperiod == undefined)? 3:ccr.utils.sum(user.school.uperiod);
        // 現在の年齢を計算
        let age = (value[0].Date.getMonth() < user.birth.getMonth() || (value[0].Date.getMonth() == user.birth.getMonth() && value[0].Date.getDate() < user.birth.getDate()))? value[0].Date.getFullYear() - user.birth.getFullYear() - 1: value[0].Date.getFullYear() - user.birth.getFullYear();
        // 義務教育と大学のグレードを計算
        let ggrade = (value[0].Date.getMonth() < user.school.entry - 1)? value[0].Date.getFullYear() - user.school.gyear:value[0].Date.getFullYear() - user.school.gyear + 1;
        let ugrade = (value[0].Date.getMonth() < user.school.uentry - 1)? value[0].Date.getFullYear() - user.school.uyear:value[0].Date.getFullYear() - user.school.uyear + 1;

        //maxageを設定
        if (age > ccr.data.maxage) ccr.data.maxage = age;

        // tooltipのデータを作成
        if (age < 0) { // 生まれてない
          tooltip = "";
        } else if (ggrade <= 0 || ugrade > uperiod || (ggrade > gperiod && ugrade <= 0) || ggrade != ggrade) { //在学期間外
          tooltip = tooltip.replace("#####", name + "<br>Age: " + String(age));
        } else if (ugrade <= 0 || ugrade != ugrade){ // 義務教育期間
          if (user.school.gname != undefined) { // 名前の定義がある時
            tooltip = tooltip.replace("#####", name + "<br>Age: " + String(age) + "<br>" + user.school.gname[ggrade -1] + ": " + String(user.school.ggrade[ggrade - 1]));
          } else if (ccr.data.school.ggrade[user.school.entry][ggrade - 1] == undefined) { // 大学の設定がない
            tooltip = tooltip.replace("#####", name + "<br>Age: " + String(age));
          } else {
            tooltip = tooltip.replace("#####", name + "<br>Age: " + String(age) + "<br>" + ccr.data.school.name[user.school.entry][ggrade -1] + ": " + String(ccr.data.school.ggrade[user.school.entry][ggrade - 1]));
          }
        } else {
          tooltip = tooltip.replace("#####", "Age: " + String(age) + "<br>Grade: " + String(ugrade));
        };

        // EVENTが設定されているかどうかを判定し、EVENTがある場合はその設定をする
        let tdmsg = ccr.draw.template.timeline.tdmsg;
        let tdmsgfmt = ccr.draw.template.timeline.tdmsgfmt;
        let dataindex = ccr.utils.getIndex(name, value, "SCategory");
        if (value[0].LCategory == "ALL") dataindex = 0;
        if (dataindex == -1) dataindex = ccr.utils.getIndex(category_order[idx], value, "LCategory");
        if (dataindex == -1) {
          tdmsg = tdmsg.replace("#####", "timeline_tdempty user_" + name).replace(/#####/g, "");
          data_users.push("data-" + name + "='undefined'");
        } else {
          tdmsgfmt = tdmsgfmt.replace("#####", (value[0].Missing.Month == true)? "":String(value[0].Date.getMonth() + 1)).replace("#####", (value[0].Missing.Day == true)? "":String(value[0].Date.getDate()) + "th").replace("#####", value[dataindex].Abstract);
          tdmsg = tdmsg.replace("#####", "user_" + name + ((ccr.utils.getIndex(category_order[idx], value, "LCategory") != -1)? " category_" + category_order[idx]:"") + ((value[0].LCategory == "ALL")? " user_ALL":"")).replace("#####", (value[dataindex].Detail != undefined)? "uk-inline":"").replace("#####", tdmsgfmt).replace("#####", (value[dataindex].Detail != undefined)? ccr.draw.template.timeline.tddd.replace("#####", value[dataindex].Detail):"");
          data_users.push("data-" + name + "='true'");
        };

        // データを追加
        tds.push( ccr.draw.template.timeline.tdage.replace("#####", name).replace("#####", (age < 0)? "":"timeline_age_" + String(age)).replace("#####", tooltip) + tdmsg);
      });

      // 各tdsに対してccr.draw.template.timeline.tdmsgを付与
      tdhtml += tds.join("");
      // htmlを置き換え
      html += trbase.replace("#####", data_users.join(" ")).replace("#####", tdhtml);
    });
    $("#timeline_tbody").html(html);
  };

  // 表示設定部分のあれこれを変更
  ccr.draw.dset = function(){
    // 初期化
    $("#discon").html("");
    $("#discon_form").html("");

    // タブを変更
    Object.keys(ccr.data.category).forEach(function(key){
      let data = this[key];
      // swicherを追加
      $("#discon").append(ccr.draw.template.dset.discon.replace("#####", key));
      // ページを追加
      let tmp = "";
      data.user.forEach(function(name){
        tmp += ccr.draw.template.dset.discon_form.children.replace("#####", name);
      });
      $("#discon_form").append(ccr.draw.template.dset.discon_form.parent.replace("#####", tmp));
    }, ccr.data.category);

    // チェックのコントローラーを作成
    $(".checkcontroller").click(function(){
      let check = $(this).parent("li").find("input");
      if ($(this).text() == "すべてチェック") {
        $(this).text("すべてチェック解除");
        check.attr('checked', true).prop('checked', true).change();
      } else {
        $(this).text("すべてチェック");
        check.removeAttr('checked').prop('checked', false).change();
      };
    });

    // チェックが変更されたら再描画するように設定しておく
    $(".check").change(function(){
      ccr.update();
    });
  };

  // CSV読み込み
  ccr.readCsv = function(data){
    // HTML5の動かないブラウザは捨て置く
    let fileReader = new FileReader();
    fileReader.readAsText(data);
    fileReader.onload = function(e){
      // 改行に\rを入れたがるExcel
      let res = e.target.result.replace(/\r/g, "");
      // resをバラして取り敢えず配列にしておく
      let data = [];
      let tmp = res.split("\n");
      $.each(tmp, function(idx, val){
        data.push(val.split(","));
      });
      ccr.init(data);
      ccr.draw.dset();
      ccr.draw.timeline();
      ccr.update();
    };
    // CSVじゃないとこの辺りに飛ばされるかもしれない
    fileReader.onerror = function(){
      alert("読み込みに失敗しました");
    };
  };

  // Input
  $('#csv').change(function(){
    ccr.readCsv(document.getElementById("csv").files[0]);
  });

  // Init
  ccr.draw();
})();
