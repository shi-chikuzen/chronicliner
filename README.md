# Chronicliner
キャラの年齢やら学年やら時系列がわからなくなった限界同人オタク用年表ツール

![動作デモ](https://raw.githubusercontent.com/shi-chikuzen/md_img/master/chronicliner/chronicliner_demo.png)

## Features
PC上に保存したデータを読み込み、イベントやキャラクターの年齢、学年等を表示するツールです。キャラクターごとの他、寮や所属、学校等のカテゴリごとのデータ管理にも対応しています。
- **できること**
  - キャラクター設定
    - キャラクターの名前の設定
    - キャラクターの誕生日の設定
    - キャラクターの義務教育課程の管理
      - 4月、9月始まり、及び任意の開始月を設定可
      - 任意の開始年齢（ex: 日本→7歳、アメリカ→6歳）を設定可
      - 任意の期間（ex: 1_5_3_4）を設定可
        - 期間を設定すると留年可能
      - 期間ごとに教育課程の名称（ex: "Kinder", "Elem", "Middle", "High"）を設定可
    - キャラクターの高等教育過程の管理
      - 4月、9月始まり、及び任意の開始月を設定可
        - 義務教育課程と開始月が変化した場合は自動で調整（留学可能）
      - 任意の期間（ex: 0_4年）を設定可
        - 期間を設定すると浪人及び留年が可能
    - 「X年にY年生」から誕生年を逆算（教育課程の開始月を考慮）
  - カテゴリ設定
    - カテゴリの名前（寮名、クラス名、学校名、チーム名、その他）の設定
    - カテゴリカラーの設定
  - イベント設定
    - 年月日の指定
      - X年以降、Y月以降、Z日以降形式での指定も可能
    - 範囲の指定
      - 全員に共通するイベント
      - カテゴリに共通するイベント
      - 個人のイベント
    - イベントの設定
      - イベントタイトル、及びイベント詳細を設定可
- **上手く使えばできること**
  - チームの所属履歴などの年表の作成
    - 但し1キャラクター1教育課程データなので、通常の教育課程は表示できない
  - その他出入り月が決まっている期間データの作成（スケート年齢など）
  - タイムリープ
    - キャラクター名を重複させなければ別キャラクターとしての処理が可能
    - カテゴリにキャラクター名を設定、キャラクター名に世界線α、世界線β...とするなど
- **できないこと**
  - 期間のあるイベントの作成
  - 時間の管理
  - キャラクターを死亡させる（年齢計算を終了できない）
  - 年表の表示範囲（年数）の設定
  - 「X年にY歳」からの誕生年逆算（~~自分で引き算して~~）
  - 「できること」に書いていないこと

## Require
通常のWebページと同様の構成なので、一般的なChrome等のブラウザ上で動作します。但し、フォントやライブラリを読み込むためにインターネット接続が必要です。
- 使用フォント
  - [Google Fonts](https://fonts.google.com/) - Noto Sans JP, Unica One
- 使用ライブラリ
  - [jQuery](https://jquery.com/)
  - [jQuery.Color](https://github.com/jquery/jquery-color)
  - [UI kit](https://getuikit.com/)


また、データ編集のために**Excel**ないし**テキストエディタ**が必要です。
csvを直に編集するのは面倒なので、極力**Excel**ないしその他**UTF-8でcsvを出力できる表計算ソフトウェア**等を使用してください。
### Browser
動作確認は以下のブラウザで行っています。
- Firefox 78.0.2
- Google Chrome 84.0.4147.89
- Safari 13.1.1

**IE及びEdgeでの動作確認は行っていません**。中身が動いたとしてもレイアウトが崩れるのではないかと思います。**今後対応する予定は一切ありません**。
なお、スマートフォンでの使用は画面が小さいために非推奨です。**動作確認は行っていません**。
## Quick Start Guide
以下の手順でサンプルデータを表示することが出来ます。
1. Chroniclinerをダウンロードして解凍
1. フォルダ内**main.html**をダブルクリック（ブラウザが起動）
1. ページ内右上のフォルダアイコンをクリック、ファイルブラウザが開いたら./dataフォルダ内のsample.csvを選択

## Usage
### Download
GitHubからcloneなりDownload ZIPなりでダウンロードします
参考：[GitHubからダウンロードする方法](http://www.humblesoft.com/wiki/?GitHub%E3%81%8B%E3%82%89%E3%83%80%E3%82%A6%E3%83%B3%E3%83%AD%E3%83%BC%E3%83%89%E3%81%99%E3%82%8B%E6%96%B9%E6%B3%95)

また、弊BOOTHでも配布しています。投げ銭もこちらからどうぞ
BOOTH：[三の重](https://threelayerbox.booth.pm/)
### Contents
Chroniclinerに含まれるのは以下のファイル及びフォルダです
- ./css/main.css - **触らないでください**（分かる人はOK）
- ./js/main.js - **触らないでください**（分かる人はOK）
- ./svg/ - **年齢間矢印用の画像フォルダ**（svg扱える人は変更可）
  - fill.svg - 最初の年齢区切り線
  - nofill.svg - 年齢区切り線
- ./data/ - データ保存用フォルダ
  - ./temp/ - **テンプレート用フォルダ**
    - temp.csv - csv形式のテンプレートファイル
    - temp.xlsx - Excel形式のテンプレートファイル
  - sample.csv - **年表データのサンプル**
- ./main.html - **本体**
- ./readme.md - 今読んでいるこれ
- ./readme.pdf - これをpdf化したもの。但し一部の表がはみ出ている


### Data Create
./data/temp/temp.xlsxを複製し、dataフォルダ内等に保存します。このファイルに書き込むことでデータを作成します。
なお、サンプルデータとして./data/sample.csvを同梱しています。書式等適宜参考にして作業を行ってください。
<br>

-----
##### 注意事項
- 大本のテンプレートファイルを**上書きしないでください**
- データの1行目（ヘッダー）を変更しないでください。**最悪動作しません**
- データを**時系列に入力する必要はありません**。勝手にソートします

<br>

-----
##### データ各列の主な使途
1. Setting - 設定用データかイベントデータかを判別します
1. LCategory - カテゴリ名を入力します
1. SCategory - キャラクター名を入力します
1. Year - 年を入力します
1. Month - 月を入力します
1. Day - 日を入力します。**設定時には別用途でも使用します**
1. Abstract - イベントタイトルを入力します。**設定時には設定内容判別のために使用します**
1. Detail - イベント詳細を入力します

<br>

-----

##### 諸設定
###### カテゴリ色の設定（任意）
以下の項目を入力します

| Setting | LCategory | SCategory | Year | Month | Day | Abstract | Detail |
| ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |
| 1 | カテゴリ名 |  |  |  |  | 色名 |  |

色名には以下の書式が設定可能です。詳しくは[jQuery.Color](https://github.com/jquery/jquery-color)を参照してください
- カラーコード - (ex: #abcdef)
- rgb形式 - (ex: rgb(100, 200, 255))
- rgba形式 - (ex: rgba(100, 200, 255, 0.5))
- 色名 - (ex: aqua)

設定例：

| Setting | LCategory | SCategory | Year | Month | Day | Abstract | Detail |
| ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |
| 1 | レイブンクロー |  |  |  |  | #00AEB9 |  |

<br>

###### キャラクター誕生日の設定（必須）
以下の項目を入力します

| Setting | LCategory | SCategory | Year | Month | Day | Abstract | Detail |
| ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |
| 1 | カテゴリ名 | キャラクター名 | 誕生年（**※任意**） | 誕生月 | 誕生日 | b |  |

Yearを空白にした場合、**Grade設定が必須**になります

設定例：

| Setting | LCategory | SCategory | Year | Month | Day | Abstract | Detail |
| ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |
| 1 | レイブンクロー | ルーナ | 1981 | 2 | 13 | b |  |

<br>

###### キャラクターのGrade設定（任意）
X年に義務教育課程何年目かを設定するための項目です。
- 日本
  - 小学1年生：1
  - 中学1年生：7
  - 高校1年生：10
- アメリカ
  - Kinder: 1
  - Elementary 1: 2
  - Middle 1: 7
  - High 1: 10

**キャラクター誕生日設定でYearを空欄にした場合は必須となります**

以下の項目を入力します

| Setting | LCategory | SCategory | Year | Month | Day | Abstract | Detail |
| ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |
| 1 | カテゴリ名 | キャラクター名 | 年 |  | 年数 | g |  |

設定例：

| Setting | LCategory | SCategory | Year | Month | Day | Abstract | Detail |
| ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |
| 1 | レイブンクロー | ルーナ | 1992 |  | 7 | g |  |

<br>

###### キャラクターの義務教育課程設定（任意）
以下の項目を入力します

| Setting | LCategory | SCategory | Year | Month | Day | Abstract | Detail |
| ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |
| 1 | カテゴリ名 | キャラクター名 | 義務教育開始年齢（任意） | 入学月 | 教育課程の年数（任意） | e | 教育課程の名称（任意） |

- **義務教育開始年齢**
  - 日本は7歳、アメリカ・イギリスは6歳です
  - 無記入の場合は入学月を参照し、4月なら7歳、9月なら6歳を適用します
- **教育課程の年数・教育課程の名称**
  - 設定する場合は**双方を記入**します
  - 教育課程の年数
    - 教育課程の年数ごとにアンダースコアで区切って入力します
  - 教育課程の名称
    - 名称をアンダースコアで区切って入力します

設定例：

| Setting | LCategory | SCategory | Year | Month | Day | Abstract | Detail |
| ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |
| 1 | レイブンクロー | ルーナ | 6 | 9 | 6_7 | e | Elem_Hog |

<br>

###### キャラクターの高等教育課程設定（任意）
以下の項目を入力します

| Setting | LCategory | SCategory | Year | Month | Day | Abstract | Detail |
| ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |
| 1 | カテゴリ名 | キャラクター名 |  | 入学月 | 教育課程の年数（任意） | u |  |

- 教育課程の年数
  - 浪人年数と教育課程の年数をアンダースコアで区切って並べます
    - 浪人年数を省略し、教育課程の年数のみを入力することも可能です
  - 省略した場合、浪人0年、教育課程3年が適用されます

設定例：

| Setting | LCategory | SCategory | Year | Month | Day | Abstract | Detail |
| ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |
| 1 | レイブンクロー | ルーナ |  | 9 | 0_3 | u |  |

<br>

-----

##### イベントの設定
###### 日付設定について
- Y月以降、Z日以降形式での設定が可能です
  - 入力値をマイナスにすることで、自動的に適用されます
    - この設定を利用する際は、マイナスとした項目より詳細な時間項目を入力することは出来ません
      - ex:
        - 1990年7月以降 - Year: 1990, Month: -7, Dayは空欄
        - 1990年7月1日以降 - Year: 1990, Month: 7, Day: -1
    - 「以降」での設定を行うと、それより詳細な時間項目は年表上に表示されなくなります
- 月、及び日は省略が可能です
  - 省略した場合、省略した数値が1であると設定されます
    - 月なら1月、日なら1日に置き換わり、仮設定された数値は表示されないように調整されます
- 同じキャラクター同士、カテゴリ同士、共通項目、に対して同じ日付のイベントを作成することは出来ません
  - 同じ日付のキャラクター、カテゴリ、共通イベントは共存します
  - 「以降」の設定を利用することで、制限を回避できます。適宜日付を調整すれば、同日・同項目に複数個のイベントを並べることが可能です

###### 全体共通イベントの設定
すべてのキャラクターに共通のイベントを設定できます
以下の項目を入力します

| Setting | LCategory | SCategory | Year | Month | Day | Abstract | Detail |
| ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |
|  | ALL |  | 年 | 月（任意） | 日（任意） | イベントタイトル | イベント詳細（任意） |

設定例：

| Setting | LCategory | SCategory | Year | Month | Day | Abstract | Detail |
| ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |
|  | ALL |  | 1998 | 5 | 2 | ヴォルデモート消滅 | 死因：ニワトコの杖の所有権移転 |

<br>

###### カテゴリ共通イベントの設定
あるカテゴリのキャラクターに共通のイベントを設定できます
以下の項目を入力します

| Setting | LCategory | SCategory | Year | Month | Day | Abstract | Detail |
| ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |
|  | カテゴリ名 |  | 年 | 月（任意） | 日（任意） | イベントタイトル | イベント詳細（任意） |

設定例：

| Setting | LCategory | SCategory | Year | Month | Day | Abstract | Detail |
| ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |
|  | レイブンクロー |  | 1998 | 5 | 2 | 部外者が寮に侵入する |  |

<br>

###### キャラクターイベントの設定
以下の項目を入力します

| Setting | LCategory | SCategory | Year | Month | Day | Abstract | Detail |
| ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |
|  | カテゴリ名 |  | 年 | 月（任意） | 日（任意） | イベントタイトル | イベント詳細（任意） |

なお、**キャラクターの生誕イベントは自動で登録されます**。
設定例：

| Setting | LCategory | SCategory | Year | Month | Day | Abstract | Detail |
| ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |
|  | レイブンクロー | ルーナ | 1996 | 12 |  | ハリーとスラグホーンのダンスパーティーに行く | 途中でハリーがマルフォイを追って離脱 |

<br>

### Save
データの入力が完了したら、Excelファイルを保存した後、**CSV（UTF-8）**形式で**もう一度保存**します。

### Show
**./main.html**をダブルクリックで開きます（ブラウザが起動します）。
右上の**フォルダアイコンをクリック**し、先程保存した**csvファイルを選択**すると、自動で年表を作成・表示します。
- 学年及び年齢はキャラクターイベント列左のバーをホバーすると表示されます
- イベント詳細はイベントカードをホバーすると表示されます

### Data Sort
表示設定アコーディオン内のチェックボックスで、キャラクターの表示・非表示を切り替えることができます。

## Licence
MITライセンスです。
- 同人・商用等での利用及び改変、改変物の配布が可能です
- 但し、このソースを使用したことによる責任の一切を負いかねます

Copyright (c) 2020 [@shi_chikuzen](https://twitter.com/shi_chikuzen)
Released under the MIT license
https://opensource.org/licenses/mit-license.php

## FAQ
- 共通イベント、カテゴリ共通イベント、キャラクターイベントの優先順位は？
  - 内部で以下の時間を付与し、時系列順に並び替えています
    - 誕生日 - 00:00
    - 共通イベント - 01:00
    - カテゴリ共通イベント - 02:00
    - キャラクターイベント - 03:00
    - 共通イベント（以降） - 04:00
    - カテゴリ共通イベント（以降） - 05:00
    - キャラクターイベント（以降） - 06:00
  - ので、時間と対象列が全く同じイベントが発生すると、2つ目以降のイベントは無視されます
- 名前の表示順どうなってるの？
  - ブラウザにもよりますが、基本的にはデータに登場したカテゴリ順→キャラクター順の優先順位で並ぶかと思います
    - 但し、内部では名前をキーにしてオブジェクトとして保存しているので、データでの順番が保持される保証は実のところありません。大抵は大丈夫なんですが、ブラウザの仕様に依存しているかたちです。~~Mapを使え~~
- めっちゃ重いんだけど？
  - データが増えるとどんどん重くなります。内部でのデータ処理だけでなく表示コンテンツも増えるからです。PCスペックと相談の上、100年くらいの年代記とか作りたかったらデータを分けるなり何なりの工夫をしてください
  - 100行〜200行くらいのデータなら問題なく動くのではないかと思います
    - ただ、キャラクター数 ×（イベントが設定されている時間数 + キャラクター数 + α）の表を作成しているので、~~お察しください~~
- 中身どうなってるの？
  - こんな感じです
    1. FileReaderでcsvを読む（のでHTML5に対応していないブラウザでは動かない）
    1. 設定とイベントで分けてデータを整理、イベントは時系列順に並び替え
    1. 表示設定を読み込んだ設定データで書き換える
    1. 必要な部分にデータを入れつつ、存在するキャラクター数×時間数のtableを作成。tableのtr及びth、tdに対し表示設定でtoggleするためのdataタグやらclassを設定する。~~ここが重い~~
    1. 表示
    1. 名前のチェック状態が変化したら、関連するdataタグとclassを持つ要素を$(要素).show()、$(要素).hide()する。thのテキストだけ消して結合してないのはこのため
  - 詳しくはJSを読んでください。~~かなり汚いけど~~
- Chroniclinerって造語？
  - 造語です
    - Chronicle + linear + er
    - つまり（年代記）＋（線形）＋（〜するもの）
- 何で作ったの？
  - 入学月が複数になる現パロ書くときに年齢操作したら、誰が何年生まれで何年生かわからなくなったからです。その時指折り数えれば済む話でも、こういうのは1回作れば何度でも使えるようになって便利ですよね？？~~ないものは作りゃいいんですよ~~
    - 指折り数えればいいことに5日かかってるのは内緒
  - 或いは既存の年表作成ツールを使えばある程度の用は足せますが、調べた範囲のWebサービスではGoogleスプレッドシートを全体公開しなければいけないのがネックでした。この用途ではあまりデータを外に公開したくないですからね。**そういうわけです**

## Contact
バグ報告、機能リクエスト等は[@shi_chikuzen](https://twitter.com/shi_chikuzen)のマシュマロ、DM等にお願いします。
