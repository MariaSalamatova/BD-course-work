const prisma = require('../prisma');

exports.getCart = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const cart = await prisma.cart.findUnique({
      where: { cart_id: id },
      include: {
        cartitems: {
          include: { product: true }
        }
      }
    });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    res.json(cart);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching cart', 
      error: error.message 
    });
  }
};