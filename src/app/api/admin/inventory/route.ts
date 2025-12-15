import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const inventory = await prisma.stringInventory.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ inventory });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 支持两种字段命名: name/model, stock_quantity/stock
    const model = body.name || body.model;
    const brand = body.brand;
    const description = body.description || null;
    const costPrice = body.cost_price || body.costPrice;
    const sellingPrice = body.selling_price || body.sellingPrice;
    const stock = body.stock_quantity ?? body.stock ?? 0;
    const minimumStock = body.minimum_stock ?? body.minimumStock ?? 5;
    const color = body.color || null;
    const gauge = body.gauge || null;
    const imageUrl = body.image_url || body.imageUrl || null;
    
    // 验证必需字段
    if (!model || !brand) {
      return NextResponse.json(
        { error: '球线名称和品牌为必填项' },
        { status: 400 }
      );
    }
    
    if (!costPrice || !sellingPrice) {
      return NextResponse.json(
        { error: '成本价和售价为必填项' },
        { status: 400 }
      );
    }
    
    const newItem = await prisma.stringInventory.create({
      data: {
        model,
        brand,
        description,
        costPrice: Number(costPrice),
        sellingPrice: Number(sellingPrice),
        stock: Number(stock),
        minimumStock: Number(minimumStock),
        color,
        gauge,
        imageUrl,
        active: true,
      },
    });
    
    // 如果初始库存大于0，创建库存日志
    if (stock > 0) {
      await prisma.stockLog.create({
        data: {
          stringId: newItem.id,
          change: Number(stock),
          type: 'restock',
          notes: 'Initial stock',
        },
      });
    }
    
    return NextResponse.json(newItem);
  } catch (error: any) {
    console.error('Create inventory error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create inventory item' },
      { status: 500 }
    );
  }
}
