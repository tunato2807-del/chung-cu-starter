import test from "node:test";
import assert from "node:assert/strict";
import {
  dictionary,
  erd,
  foreignKeys,
  verifyMigrations,
  readMetadata,
} from "./export-schema.js";

function fixture() {
  return {
    tables: ["parent", "child"].map((table_name) => ({
      table_name,
      engine: "InnoDB",
      table_collation: "utf8mb4_0900_ai_ci",
    })),
    columns: [
      {
        table_name: "parent",
        column_name: "id",
        data_type: "int",
        column_type: "int unsigned",
        is_nullable: "NO",
      },
      {
        table_name: "parent",
        column_name: "block",
        data_type: "varchar",
        column_type: "varchar(10)",
        is_nullable: "NO",
      },
      {
        table_name: "child",
        column_name: "parent_id",
        data_type: "int",
        column_type: "int unsigned",
        is_nullable: "YES",
      },
      {
        table_name: "child",
        column_name: "block",
        data_type: "varchar",
        column_type: "varchar(10)",
        is_nullable: "NO",
      },
      {
        table_name: "child",
        column_name: "amount",
        data_type: "decimal",
        column_type: "decimal(12,2)",
        is_nullable: "NO",
        extra: "STORED GENERATED",
        generation_expression: "if(`parent_id` > 0, 1, NULL)",
      },
    ],
    foreignKeys: ["parent_id", "block"].map((column_name, i) => ({
      table_name: "child",
      column_name,
      constraint_name: "fk_parent",
      ordinal_position: i + 1,
      referenced_table_name: "parent",
      referenced_column_name: i ? "block" : "id",
      update_rule: "CASCADE",
      delete_rule: "RESTRICT",
    })),
    indexes: ["parent_id", "block"].map((column_name, i) => ({
      table_name: "child",
      column_name,
      index_name: "uk_parent",
      non_unique: 0,
      seq_in_index: i + 1,
    })),
    checks: [
      {
        table_name: "child",
        constraint_name: "ck_amount",
        check_clause: "amount >= 0 | amount is null",
      },
    ],
  };
}
test("FK ghép chỉ có một quan hệ, nullable và UNIQUE quyết định lực lượng", () => {
  const schema = fixture();
  const keys = foreignKeys(schema);
  assert.equal(keys.length, 1);
  assert.deepEqual(keys[0].columns, ["parent_id", "block"]);
  assert.equal(keys[0].nullable, true);
  assert.equal(keys[0].unique, true);
  const diagram = erd(schema);
  assert.match(diagram, /parent o\|--o\| child/);
  assert.equal((diagram.match(/ : /g) || []).length, 1);
  assert.match(diagram, /decimal amount "decimal\(12,2\)/);
  schema.indexes = [];
  schema.columns[2].is_nullable = "NO";
  assert.match(erd(schema), /parent \|\|--o\{ child/);
});
test("từ điển giữ kiểu, cột sinh, check, FK và checksum", () => {
  const document = dictionary(fixture(), [
    { name: "018_test.sql", checksum: "abc" },
  ]);
  assert.match(document, /decimal\(12,2\)/);
  assert.match(document, /STORED GENERATED; if\(&#96;parent_id/);
  assert.match(document, /UPDATE CASCADE, DELETE RESTRICT/);
  assert.ok(document.includes("0 \\| amount"));
  assert.match(document, /018_test.sql.*abc/);
});
test("không xuất khi thiếu migration, checksum đổi hoặc DB chạy trước checkout", () => {
  const files = [{ name: "018_test.sql", checksum: "abc" }];
  assert.doesNotThrow(() => verifyMigrations(files, files));
  assert.throws(() => verifyMigrations(files, []));
  assert.throws(() =>
    verifyMigrations(files, [{ ...files[0], checksum: "changed" }]),
  );
  assert.throws(() =>
    verifyMigrations(files, [...files, { name: "019.sql", checksum: "x" }]),
  );
});
test("metadata exporter chỉ đọc information_schema, không đọc hàng nghiệp vụ", async () => {
  const queries = [];
  const schema = await readMetadata({
    query: async (sql) => {
      queries.push(sql);
      return [[]];
    },
  });
  assert.equal(schema.tables.length, 0);
  assert.equal(queries.length, 5);
  assert.ok(
    queries.every(
      (sql) => /^SELECT /i.test(sql) && /FROM information_schema\./.test(sql),
    ),
  );
  assert.ok(queries.every((sql) => !/password|mat_khau|SELECT \*/i.test(sql)));
});
