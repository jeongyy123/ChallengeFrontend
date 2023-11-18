import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { createMenus } from '../middlewares/joi.error.definition.js';

const router = express.Router();

/** 메뉴 등록 **/
router.post('/categories/:categoryId/menus', authMiddleware, async (req, res) => {
  try {
    const validation = await createMenus.validateAsync(req.body);
    const { name, description, image, price, order } = req.body;
    const { categoryId } = req.params;
    const { userId } = req.user;

    const user = await prisma.Users.findFirst({
      where: { userId: Number(userId) },
    });

    if (user.type !== 'OWNER') {
      return res.status(400).json({ message: '사장님만 사용할 수 있는 API입니다.' });
    }

    if (!categoryId) {
      return res.status(400).json({ message: '존재하지 않는 카테고리입니다.' });
    }

    const maxOrder = await prisma.menus.findFirst({
      orderBy: { order: 'desc' },
    });

    const orderPlus = maxOrder ? maxOrder.order + 1 : 1; //order + 1 해주기 위함. (id는 따로 있어서 autoincrement불가로 인하여 불가피하게 +1씩 해줌)

    await prisma.menus.create({
      data: {
        CategoryId: Number(categoryId),
        UserId: Number(userId),
        name,
        description,
        image,
        price,
        order: Number(orderPlus),
      },
    });

    return res.status(200).json({ message: '메뉴를 등록하였습니다.' });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

/** 카테고리별 메뉴 조회 **/
router.get('/categories/:categoryId/menus', async (req, res) => {
  try {
    const { categoryId } = req.params;

    const menu = await prisma.menus.findMany({
      select: {
        menuId: true,
        name: true,
        image: true,
        price: true,
        order: true,
        status: true,
      },
      where: { CategoryId: +categoryId },
      orderBy: { order: 'asc' },
    });

    if (!menu) {
      return res.status(400).json({ message: '존재하지 않는 카테고리입니다.' });
    }

    return res.status(200).json({ data: menu });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

/** 메뉴 상세 조회 **/
router.get('/categories/:categoryId/menus/:menuId', async (req, res) => {
  try {
    const { categoryId, menuId } = req.params;

    if (!categoryId || !menuId) {
      return res.status(400).json({ message: '데이터 형식이 올바르지 않습니다.' });
    }

    const menu = await prisma.menus.findFirst({
      where: { CategoryId: Number(categoryId), menuId: Number(menuId) },
      select: {
        CategoryId: true,
        name: true,
        description: true,
        image: true,
        price: true,
        order: true,
        status: true,
      },
    });

    if (!menu) {
      return res.status(400).json({ message: '존재하지 않는 메뉴입니다.' });
    }

    return res.status(200).json({ data: menu });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

/** 메뉴 수정 **/
router.patch(
  '/categories/:categoryId/menus/:menuId',
  authMiddleware,
  async (req, res) => {
    try {
      const validation = await createMenus.validateAsync(req.body);
      const { name, description, price, order, status } = validation;
      const { categoryId, menuId } = req.params;
      const { userId } = req.user;

      const user = await prisma.Users.findFirst({
        where: { userId: Number(userId) },
      });

      if (user.type !== 'OWNER') {
        return res.status(400).json({ message: '사장님만 사용할 수 있는 API입니다.' });
      }

      const menu = await prisma.menus.findFirst({
        where: { CategoryId: Number(categoryId), menuId: Number(menuId) },
      });

      if (!menu) {
        return res.status(400).json({ message: '존재하지 않는 메뉴입니다.' });
      }

      const currentMenu = await prisma.menus.findFirst({
        where: { order: Number(order) },
      });

      if (currentMenu) {
        await prisma.menus.updateMany({
          where: {
            CategoryId: +categoryId,
            OR: [{ order: { gt: order } }, { order }],
          },
          data: { order: { increment: 1 } },
        });
      }

      await prisma.menus.update({
        data: { name, description, price, order, status },
        where: { CategoryId: Number(categoryId), menuId: Number(menuId) },
      });

      return res.status(200).json({ message: '메뉴를 수정하였습니다.' });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },
);

/** 메뉴 삭제 **/
router.delete(
  '/categories/:categoryId/menus/:menuId',
  authMiddleware,
  async (req, res) => {
    try {
      const { categoryId, menuId } = req.params;
      const { userId } = req.user;

      const user = await prisma.Users.findFirst({
        where: { userId: Number(userId) },
      });

      if (user.type !== 'OWNER') {
        return res.status(400).json({ message: '사장님만 사용할 수 있는 API입니다.' });
      }

      const menu = await prisma.menus.findFirst({
        where: { CategoryId: Number(categoryId), menuId: Number(menuId) },
      });

      if (!menu) {
        return res.status(400).json({ error: '메뉴가 존재하지않습니다.' });
      }
      await prisma.menus.delete({
        where: { CategoryId: Number(categoryId), menuId: Number(menuId) },
      });

      return res.status(200).json({ message: '메뉴를 삭제하였습니다.' });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },
);

export default router;
