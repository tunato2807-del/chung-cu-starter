-- PostgreSQL migration. Legacy MySQL migrations are preserved unchanged.
ALTER TABLE lich_su_ban_giao_can_ho
  DROP CONSTRAINT lich_su_ban_giao_can_ho_ibfk_2,
  DROP CONSTRAINT lich_su_ban_giao_can_ho_ibfk_3;
