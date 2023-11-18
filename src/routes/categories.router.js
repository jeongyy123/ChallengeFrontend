import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { createCategories } from '../middlewares/joi.error.definition.js';

const router = express.Router();

/** 카테고리 등록 **/
router.post('/categories', authMiddleware, async (req, res, next) => {
  try {
    const validation = await createCategories.validateAsync(req.body);
    const { name } = validation;
    const { userId } = req.user;

    const user = await prisma.Users.findFirst({
      where: { userId: Number(userId) },
    });

    if (user.type !== 'OWNER') {
      return res.status(400).json({ message: '사장님만 사용할 수 있는 API입니다.' });
    }

    const maxOrder = await prisma.Categories.findFirst({
      orderBy: { order: 'desc' },
    });
    const orderPlus = maxOrder ? maxOrder.order + 1 : 1; //order+1 해주기 위함. (id는 따로 있어서 autoincrement불가로 인하여 불가피하게 +1씩 해줌)

    await prisma.Categories.create({
      data: {
        name,
        order: Number(orderPlus),
        User: {
          connect: {
            userId: Number(userId),
          },
        },
      },
    });
    return res.status(200).json({ message: '카테고리를 등록하였습니다.' });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

/** 카테고리 목록 조회 **/
router.get('/categories', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user;

    const user = await prisma.Users.findFirst({
      where: { userId: Number(userId) },
    });

    if (!user) {
      return res.status(400).json({ message: '회원만 조회 가능합니다.' });
    }
    const category = await prisma.Categories.findMany({
      select: {
        categoryId: true,
        name: true,
        order: true,
      },
      orderBy: { order: 'asc' },
    });

    if (!category) {
      return res.status(400).json({ errorMessage: '데이터가 없습니다.' });
    }

    return res.status(200).json({ data: category });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

/** 카테고리 정보 변경 **/
router.patch('/categories/:categoryId', authMiddleware, async (req, res) => {
  try {
    const validation = await createCategories.validateAsync(req.body);
    const { name, order } = validation;
    const { categoryId } = req.params;
    const { userId } = req.user;

    const user = await prisma.Users.findFirst({
      where: { userId: Number(userId) },
    });

    if (user.type !== 'OWNER') {
      return res.status(400).json({ message: '사장님만 사용할 수 있는 API입니다.' });
    }

    const currentCategory = await prisma.Categories.findFirst({
      where: { order: +order },
    });

    if (currentCategory) {
      await prisma.categories.updateMany({
        where: {
          OR: [{ order: { gt: order } }, { order }],
        },
        data: { order: { increment: 1 } },
      });
    }

    await prisma.Categories.update({
      where: {
        categoryId: Number(categoryId),
      },
      data: { name, order },
    });

    return res.status(200).json({ messge: '카테고리 정보를 수정하였습니다.' });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

/** 카테고리 삭제 **/
router.delete('/categories/:categoryId', authMiddleware, async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { userId } = req.user;

    const user = await prisma.Users.findFirst({
      where: { userId: Number(userId) },
    });

    if (user.type !== 'OWNER') {
      return res.status(400).json({ message: '사장님만 사용할 수 있는 API입니다.' });
    }

    const category = await prisma.Categories.findFirst({
      where: { categoryId: +categoryId },
    });

    if (!category) {
      return res.status(400).json({ message: '존재하지않는 카테고리입니다.' });
    }

    await prisma.Categories.delete({ where: { categoryId: +categoryId } });

    return res.status(200).json({ messge: '카테고리 정보를 삭제하였습니다.' });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

export default router;
