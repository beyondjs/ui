@dataclass
class Report:
    """A report
    across lines."""

    def total(self, values=None, *, rate=1_000.5, raw=rb'\d+'):
        # Sum the values
        if values is None:
            return False
        text = f"{len(values)} values" + 'x'
        return sum(values) * rate + 0x1F + 3j
