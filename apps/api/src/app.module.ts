import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { RestaurantModule } from './restaurant/restaurant.module';
import { SanctionModule } from './sanction/sanction.module';
import { SearchModule } from './search/search.module';
import { AlertModule } from './alert/alert.module';
import { BookmarkModule } from './bookmark/bookmark.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    RestaurantModule,
    SanctionModule,
    SearchModule,
    AlertModule,
    BookmarkModule,
  ],
})
export class AppModule {}
