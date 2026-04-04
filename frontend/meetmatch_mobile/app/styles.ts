import { StyleSheet } from 'react-native';

export const PURPLE_100 = '#f3e8ff';
export const PURPLE_200 = '#ddd6fe';
export const PURPLE_500 = '#a855f7';
export const PURPLE_700 = '#7e22ce';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PURPLE_200,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  mainContainer: {
    flex: 1,
    paddingTop: 18,
  },
  mainHeader: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 24,
  },
  logoBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: PURPLE_500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 20,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: PURPLE_500,
    textAlign: 'center',
    marginBottom: 0,
  },
  mainWelcome: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '600',
    color: PURPLE_700,
    textAlign: 'center',
  },
  card: {
    backgroundColor: PURPLE_500,
    borderRadius: 12,
    padding: 16,
    gap: 10,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: PURPLE_100,
  },
  subtitleBold: {
    fontWeight: '700',
    color: '#ffffff',
  },
  sectionHeading: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  input: {
    borderWidth: 1,
    borderColor: PURPLE_500,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#000000',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  inputHalf: {
    flex: 1,
    borderWidth: 1,
    borderColor: PURPLE_500,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#000000',
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PURPLE_500,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#000000',
    backgroundColor: '#ffffff',
  },
  passwordToggle: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PURPLE_100,
  },
  passwordToggleText: {
    color: PURPLE_700,
    fontWeight: '700',
    fontSize: 13,
  },
  primaryButton: {
    marginTop: 4,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    opacity: 1,
  },
  primaryButtonPressed: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: PURPLE_500,
    fontWeight: '600',
    fontSize: 16,
  },
  linkText: {
    color: PURPLE_100,
    textAlign: 'center',
    marginTop: 8,
  },
  linkButton: {
    marginTop: 12,
  },
  errorText: {
    color: '#ffffff',
    marginTop: 4,
    textAlign: 'center',
  },
  successText: {
    color: '#ffffff',
    marginTop: 4,
    textAlign: 'center',
  },
  mainPages: {
    flex: 1,
  },
  mainPagesContent: {
    alignItems: 'stretch',
    flexGrow: 1,
  },
  mainPage: {
    flex: 1,
    paddingHorizontal: 16,
  },
  mainPageScroll: {
    flex: 1,
  },
  mainPageScrollContent: {
    flexGrow: 1,
    paddingBottom: 8,
  },
  mainCard: {
    flexGrow: 1,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    minHeight: 420,
    borderWidth: 1,
    borderColor: PURPLE_100,
  },
  mainCardTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: PURPLE_700,
    marginBottom: 8,
  },
  mainCardText: {
    fontSize: 15,
    color: '#5b5670',
    marginBottom: 16,
  },
  mainList: {
    gap: 12,
  },
  mainListItem: {
    backgroundColor: PURPLE_100,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: PURPLE_200,
  },
  mainListTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PURPLE_700,
    marginBottom: 4,
  },
  mainListText: {
    fontSize: 14,
    color: '#4b5563',
  },
  profileRow: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: PURPLE_100,
  },
  profileLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: PURPLE_500,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  profileValue: {
    fontSize: 16,
    color: '#1f2937',
  },
  profileInput: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: PURPLE_200,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#ffffff',
  },
  profileHint: {
    marginTop: 6,
    fontSize: 12,
    color: '#6b7280',
  },
  profileSuccess: {
    marginTop: 8,
    textAlign: 'center',
    color: PURPLE_700,
    fontWeight: '600',
  },
  secondaryButton: {
    marginTop: 10,
    backgroundColor: PURPLE_100,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: PURPLE_700,
    fontWeight: '600',
    fontSize: 16,
  },
  logoutButton: {
    marginTop: 10,
    backgroundColor: PURPLE_500,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PURPLE_500,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  bottomNav: {
    flexDirection: 'row',
    marginTop: 16,
    marginHorizontal: 16,
    marginBottom: 18,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 8,
    gap: 8,
  },
  navItem: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  navItemActive: {
    backgroundColor: PURPLE_500,
  },
  navText: {
    color: PURPLE_500,
    fontWeight: '600',
  },
  navTextActive: {
    color: '#ffffff',
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
  },
  pillSelected: {
    backgroundColor: PURPLE_100,
    borderColor: PURPLE_500,
  },
  pillText: {
    color: '#000000',
  },
  pillTextSelected: {
    color: PURPLE_500,
    fontWeight: '600',
  },
  topPillSelected: {
    backgroundColor: PURPLE_100,
    borderColor: PURPLE_500,
  },
  topPillTextSelected: {
    color: PURPLE_700,
    fontWeight: '700',
  },
});
