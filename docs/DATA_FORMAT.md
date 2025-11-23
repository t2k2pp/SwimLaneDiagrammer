# Swimlane Diagrammer データフォーマット定義書

本文書は、Swimlane Diagrammerアプリケーションで使用されるインポート/エクスポート用のJSONデータフォーマットについて記述します。

## 概要

本アプリケーションはJSON形式での図のインポートをサポートしています。Pool、Lane、Shape、Connectionなどの要素を定義することで、外部で作成したデータを読み込むことが可能です。

## ファイル構造

ルートオブジェクトは以下のプロパティを持つ必要があります：

```json
{
  "name": "プロジェクト名",
  "lastModified": 1700000000000,
  "data": {
    "pools": [...],
    "shapes": [...] または {...},
    "connections": [...],
    "groups": {...},
    "textBoxes": [...]
  }
}
```

## データオブジェクト

### Pools (プール)

Poolオブジェクトの配列です。

```json
"pools": [
  {
    "id": "pool-1",
    "title": "プールのタイトル",
    "position": { "x": 50, "y": 50 },
    "width": 800,
    "orientation": "horizontal",
    "lanes": [
      {
        "id": "lane-1",
        "title": "レーンのタイトル",
        "height": 150,
        "shapeIds": [] // 省略可能（インポート時に自動再構築されます）
      }
    ]
  }
]
```

### Shapes (シェイプ)

Shapeは**配列**（手書き推奨）または**レコードオブジェクト**（内部フォーマット）のいずれかで定義できます。

**配列フォーマット（推奨）:**
```json
"shapes": [
  {
    "id": "shape-1",
    "type": "start",
    "position": { "x": 50, "y": 50 }, // レーンに対する相対座標
    "size": { "width": 40, "height": 40 },
    "label": "開始",
    "parentId": "lane-1", // 所属するレーンのID（必須）
    "color": "#ff0000", // 任意の背景色（省略可能）
    "textColor": "white" // テキスト色 ("white" | "black")（省略可能）
  }
]
```

**サポートされているシェイプタイプ:**
- `start` (開始), `end` (終了)
- `rect` (処理)
- `diamond` (判断)
- `circle` (円)
- `document` (書類)
- `database` (データベース)
- `manual-input` (手動入力)
- `delay` (遅延)

### Connections (接続)

Connectionオブジェクトの配列です。

```json
"connections": [
  {
    "id": "conn-1",
    "sourceShapeId": "shape-1",
    "targetShapeId": "shape-2"
  }
]
```

### TextBoxes (テキストボックス)

独立したメモや説明を記述するためのTextBoxオブジェクトの配列です。

```json
"textBoxes": [
  {
    "id": "note-1",
    "position": { "x": 100, "y": 500 }, // 絶対座標
    "size": { "width": 200, "height": 100 },
    "content": "# タイトル\n説明文（Markdown形式）"
  }
]
```

### Groups (グループ)

シェイプのグループ化を定義するレコードオブジェクトです。

```json
"groups": {
  "group-1": {
    "id": "group-1",
    "shapeIds": ["shape-1", "shape-2"]
  }
}
```

## インポート時の挙動

JSONファイルをインポートする際、以下の処理が自動的に行われます：

1.  **正規化**: `shapes`配列は内部的なレコードフォーマットに変換されます。
2.  **レーンリンクの再構築**: `shape.parentId`に基づいて、`lane.shapeIds`が自動的に再構築されます。そのため、JSON作成時に`lane.shapeIds`を手動で記述する必要はありません。
