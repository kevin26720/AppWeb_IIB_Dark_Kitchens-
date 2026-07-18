import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding catalog database...');

  const products = [
    {
      name: 'Menú Ejecutivo de Asado',
      description: 'Selección premium de carnes a la parrilla con guarniciones gourmet. Incluye entrada, plato fuerte y postre del día.',
      price: 28.50,
      category: 'Platos Fuertes',
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400',
      available: true,
    },
    {
      name: 'Ensalada César Premium',
      description: 'Lechuga romana fresca, crutones artesanales, parmesano reggiano y aderezo césar casero con anchoas importadas.',
      price: 12.00,
      category: 'Ensaladas',
      imageUrl: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400',
      available: true,
    },
    {
      name: 'Jugo Natural de Maracuyá',
      description: 'Jugo fresco de maracuyá con toque de menta y azúcar de caña. Sin conservantes artificiales.',
      price: 5.50,
      category: 'Bebidas',
      imageUrl: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400',
      available: true,
    },
    {
      name: 'Paella Valenciana',
      description: 'Arroz bomba de azafrán, mariscos frescos del día, chorizo español y verduras de temporada.',
      price: 32.00,
      category: 'Platos Fuertes',
      imageUrl: 'https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=400',
      available: true,
    },
    {
      name: 'Pollo a la Mostaza',
      description: 'Pechuga de pollo orgánico en salsa de mostaza Dijon con hierbas finas y papas rústicas al romero.',
      price: 22.00,
      category: 'Platos Fuertes',
      imageUrl: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=400',
      available: true,
    },
    {
      name: 'Bruschetta Mediterránea',
      description: 'Pan artesanal tostado con tomates cherry, albahaca fresca, aceite de oliva extra virgen y reducción de balsámico.',
      price: 9.00,
      category: 'Entradas',
      imageUrl: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400',
      available: true,
    },
    {
      name: 'Tiramisú Clásico',
      description: 'Postre italiano tradicional con mascarpone cremoso, café espresso y cacao amargo. Receta de la casa.',
      price: 8.50,
      category: 'Postres',
      imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400',
      available: true,
    },
    {
      name: 'Ceviche de Camarón',
      description: 'Camarones frescos marinados en limón con cebolla morada, cilantro, aguacate y chips de plátano.',
      price: 15.00,
      category: 'Entradas',
      imageUrl: 'https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?w=400',
      available: true,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { id: products.indexOf(product) + 1 },
      update: {},
      create: product,
    });
  }

  console.log(`✅ Seeded ${products.length} products`);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
