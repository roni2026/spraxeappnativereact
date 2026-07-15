import { NavigatorScreenParams } from '@react-navigation/native';

export type TabParamList = {
  Home: undefined;
  Saved: undefined;
  Categories: { categoryId?: string; categoryName?: string } | undefined;
  Cart: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  Products: { categoryId?: string; categoryName?: string; initialQuery?: string } | undefined;
  ProductDetail: { id: string; name?: string; slug?: string } | undefined;
  Orders: undefined;
  OrderDetail: { orderId: string; orderNumber?: string };
  Wishlist: undefined;
  Support: undefined;
  TrackOrder: undefined;
  Compare: undefined;
};
