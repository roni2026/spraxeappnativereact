import { NavigatorScreenParams } from '@react-navigation/native';

export type TabParamList = {
  Home: undefined;
  Categories: { categoryId?: string; categoryName?: string } | undefined;
  Cart: undefined;
  Account: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  Products: { categoryId?: string; categoryName?: string; initialQuery?: string } | undefined;
  ProductDetail: { slug: string; name?: string };
  Orders: undefined;
  OrderDetail: { orderId: string; orderNumber?: string };
  Wishlist: undefined;
};
