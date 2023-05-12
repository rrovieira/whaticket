import { Sequelize, Op } from "sequelize";
import Company from "../../database/models/Company";
import Profiles from "../../database/models/Profiles";
import Queue from "../../database/models/Queue";
import User from "../../database/models/User";

interface Request {
  searchParam?: string;
  pageNumber?: string | number;
  selectedCompanyId?: string;
  companyId: number;
}

interface Response {
  users: User[];
  count: number;
  hasMore: boolean;
}

const ListUsersService = async ({
  searchParam = "",
  pageNumber = "1",
  companyId,
  selectedCompanyId,
}: Request): Promise<Response> => {
  let whereCondition = null;

  whereCondition = {
    [Op.or]: [
      {
        "$User.name$": Sequelize.where(
          Sequelize.fn("LOWER", Sequelize.col("User.name")),
          "LIKE",
          `%${searchParam.toLowerCase()}%`
        )
      },
      {
        "$User.nickname$": Sequelize.where(
          Sequelize.fn("LOWER", Sequelize.col("User.nickname")),
          "LIKE",
          `%${searchParam.toLowerCase()}%`
        )
      },
      { email: { [Op.like]: `%${searchParam.toLowerCase()}%` } }
    ],
    deletedAt: null
  };

  if (selectedCompanyId) {
    whereCondition = { ...whereCondition, companyId: selectedCompanyId };
  }

  if (companyId !== 1) {
    whereCondition = { ...whereCondition, companyId };
  }

  const limit = 20;
  const offset = limit * (+pageNumber - 1);

  const { count, rows: users } = await User.findAndCountAll({
    where: whereCondition,
    attributes: ["nickname", "name", "id", "email", "profileId", "createdAt", "useNickname"],
    limit,
    offset,
    order: [["createdAt", "DESC"]],
    include: [
      { model: Company, as: "company", attributes: ["name"], required: true },
      { model: Profiles, as: "profiles", attributes: ["id", "name", "permissions", "menus"] }
    ],
    raw: true
  });

  const hasMore = count > offset + users.length;

  return {
    users,
    count,
    hasMore
  };
};

export default ListUsersService;
