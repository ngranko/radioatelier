export default interface Request<T = never> {
    send(): Promise<T>;
}
